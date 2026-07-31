<?php
/**
 * Приём заявок с сайта → лид в Битрикс24 (+ дубль в Telegram).
 *
 * Форма (lead-form.js) шлёт сюда JSON. Секреты лежат в crm-config.php,
 * который не попадает в браузер и не хранится в git.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/** Ответ клиенту и выход. Наружу уходит только код ошибки, без подробностей. */
function lf_reply(bool $ok, string $error = '', int $status = 200): void {
    http_response_code($status);
    echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = @include __DIR__ . '/crm-config.php';
if (!is_array($config)) {
    error_log('crm.php: crm-config.php отсутствует или повреждён');
    lf_reply(false, 'server_config', 500);
}

/** Запись в журнал заявок. */
function lf_log(array $config, string $message): void {
    if (empty($config['log_file'])) return;
    $line = date('Y-m-d H:i:s') . ' ' . $message . PHP_EOL;
    @file_put_contents($config['log_file'], $line, FILE_APPEND | LOCK_EX);
}

/* ── Проверки запроса ───────────────────────────────────────── */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    lf_reply(false, 'method', 405);
}

$origins = $config['allowed_origins'] ?? [];
if ($origins) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && !in_array($origin, $origins, true)) {
        lf_reply(false, 'origin', 403);
    }
}

$raw = file_get_contents('php://input');
if (strlen($raw) > 20000) {
    lf_reply(false, 'too_large', 413);
}
$in = json_decode($raw, true);
if (!is_array($in)) {
    lf_reply(false, 'bad_request', 400);
}

// Ловушка для ботов: поле скрыто от людей, заполнено — значит бот.
if (!empty($in['company'])) {
    lf_reply(true);
}

$phoneDigits = preg_replace('/\D+/', '', (string)($in['phone'] ?? ''));
if (strlen($phoneDigits) < 10) {
    lf_reply(false, 'phone', 400);
}
if (empty($in['consent'])) {
    lf_reply(false, 'consent', 400);
}

/* ── Ограничение частоты по IP ──────────────────────────────── */

$limit = (int)($config['rate_limit'] ?? 0);
if ($limit > 0) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $bucket = sys_get_temp_dir() . '/lf_' . md5($ip) . '.txt';
    $hits = [];
    if (is_readable($bucket)) {
        $hits = array_filter(
            explode(',', (string)file_get_contents($bucket)),
            fn($t) => (int)$t > time() - 600
        );
    }
    if (count($hits) >= $limit) {
        lf_log($config, "RATE LIMIT ip={$ip}");
        lf_reply(false, 'rate_limit', 429);
    }
    $hits[] = time();
    @file_put_contents($bucket, implode(',', $hits), LOCK_EX);
}

/* ── Данные заявки ──────────────────────────────────────────── */

/** Обрезка и очистка пользовательского текста. */
function lf_clean($value, int $max = 500): string {
    $s = trim((string)$value);
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $s);
    return mb_substr($s, 0, $max);
}

$name    = lf_clean($in['name'] ?? '', 100);
$phone   = lf_clean($in['phone'] ?? '', 30);
$comment = lf_clean($in['comment'] ?? '', 2000);
$product = lf_clean($in['product'] ?? '', 200);
$page    = lf_clean($in['page'] ?? '', 300);
$referer = lf_clean($in['referrer'] ?? '', 300);
$roistat = lf_clean($in['roistat'] ?? '', 100);

$utm = [];
foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as $key) {
    $value = lf_clean($in[$key] ?? '', 200);
    if ($value !== '') $utm[strtoupper($key)] = $value;
}

$title = 'Заявка с сайта' . ($product !== '' ? ': ' . $product : '');

$siteLabel = lf_clean($config['site_label'] ?? '', 100);

// «Дополнительно об источнике» — только домен сайта, без служебного текста.
// Страница/переход/Roistat уходят в комментарий, чтобы данные не потерялись.
$metaParts = array_filter([
    $page !== ''    ? 'Страница: ' . $page : '',
    $referer !== '' ? 'Переход с: ' . $referer : '',
    $roistat !== '' ? 'Roistat: ' . $roistat : '',
]);

$comments = implode("\n\n", array_filter([
    $product !== '' ? 'Интересует: ' . $product : '',
    $comment,
    $metaParts ? implode("\n", $metaParts) : '',
]));

$fields = [
    'TITLE'              => $title,
    'NAME'               => $name !== '' ? $name : 'Не указано',
    'COMMENTS'           => $comments,
    'SOURCE_ID'          => $config['b24_source_id'] ?? 'WEB',
    'SOURCE_DESCRIPTION' => $siteLabel,
    'OPENED'             => 'Y',
    'PHONE'              => [['VALUE' => $phone, 'VALUE_TYPE' => 'WORK']],
] + $utm;
if (!empty($config['b24_assigned_by'])) {
    $fields['ASSIGNED_BY_ID'] = (int)$config['b24_assigned_by'];
}
if (!empty($config['b24_roistat_field']) && $roistat !== '') {
    $fields[$config['b24_roistat_field']] = $roistat;
}

/* ── Отправка ───────────────────────────────────────────────── */

/** POST-запрос с телом в JSON. Возвращает [код ответа, тело]. */
function lf_post(string $url, array $payload, int $timeout = 10): array {
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $timeout,
        ]);
        $response = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($response === false) $response = 'curl: ' . curl_error($ch);
        curl_close($ch);
        return [$code, (string)$response];
    }

    $context = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => "Content-Type: application/json\r\n",
        'content'       => $body,
        'timeout'       => $timeout,
        'ignore_errors' => true,
    ]]);
    $response = @file_get_contents($url, false, $context);
    $code = 0;
    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('~^HTTP/\S+\s+(\d{3})~', $header, $m)) $code = (int)$m[1];
    }
    return [$code, (string)$response];
}

$webhook = rtrim((string)($config['b24_webhook'] ?? ''), '/');
[$code, $response] = lf_post($webhook . '/crm.lead.add.json', [
    'fields' => $fields,
    'params' => ['REGISTER_SONET_EVENT' => 'Y'],
]);

$result = json_decode($response, true);
$leadId = (is_array($result) && isset($result['result'])) ? (int)$result['result'] : 0;

if ($leadId <= 0) {
    lf_log($config, "B24 ERROR http={$code} phone={$phone} resp=" . mb_substr($response, 0, 500));
} else {
    lf_log($config, "LEAD #{$leadId} phone={$phone} name={$name} product={$product}");
}

// Дубль в Telegram — не влияет на ответ клиенту.
if (!empty($config['tg_token']) && !empty($config['tg_chat_id'])) {
    $esc = fn($s) => htmlspecialchars($s, ENT_NOQUOTES, 'UTF-8');
    $lines = array_filter([
        '🏗 <b>Новая заявка с сайта ЗМК</b>',
        '',
        $product !== '' ? '📦 <b>Товар:</b> ' . $esc($product) : '',
        '👤 <b>Имя:</b> ' . $esc($name !== '' ? $name : 'не указано'),
        '📞 <b>Телефон:</b> ' . $esc($phone),
        $comment !== '' ? '💬 <b>Комментарий:</b> ' . $esc($comment) : '',
        '',
        $leadId > 0 ? "✅ Лид в Битрикс24: #{$leadId}" : '⚠️ В Битрикс24 не попало — проверьте журнал',
        '🌐 Страница: ' . $esc($page),
    ], fn($l) => $l !== '');

    [$tgCode, $tgResponse] = lf_post(
        'https://api.telegram.org/bot' . $config['tg_token'] . '/sendMessage',
        ['chat_id' => $config['tg_chat_id'], 'text' => implode("\n", $lines), 'parse_mode' => 'HTML'],
        7
    );
    if ($tgCode !== 200) {
        lf_log($config, "TG ERROR http={$tgCode} resp=" . mb_substr($tgResponse, 0, 300));
    }
}

if ($leadId <= 0) {
    lf_reply(false, 'crm', 502);
}
lf_reply(true);
