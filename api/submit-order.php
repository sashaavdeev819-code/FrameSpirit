<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Конфигурация
$BOT_TOKEN = 'ВАШ_BOT_TOKEN';
$ADMIN_CHAT_ID = 'ВАШ_CHAT_ID';
$LOG_FILE = 'orders.log';

// Получение данных
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Нет данных']);
    exit;
}

// Генерация ID заказа
$orderId = 'PC-' . date('Ymd') . '-' . substr(md5(uniqid()), 0, 6);

// Сохранение в лог-файл
$logEntry = date('Y-m-d H:i:s') . " | ID: $orderId | " . 
            "Услуга: {$input['serviceName']} | " .
            "Имя: {$input['name']} | " .
            "Телефон: {$input['phone']}\n";

file_put_contents($LOG_FILE, $logEntry, FILE_APPEND | LOCK_EX);

// Отправка в Telegram
$message = formatTelegramMessage($orderId, $input);
sendTelegramMessage($BOT_TOKEN, $ADMIN_CHAT_ID, $message);

// Ответ клиенту
echo json_encode([
    'success' => true,
    'order_id' => $orderId,
    'message' => 'Заявка принята'
]);

function formatTelegramMessage($orderId, $data) {
    return "
🛠️ *НОВАЯ ЗАЯВКА #$orderId*

*Услуга:* {$data['serviceName']}
*Имя:* {$data['name']}
*Телефон:* `{$data['phone']}`
" . ($data['email'] ? "*Email:* {$data['email']}\n" : "") .
($data['address'] ? "*Адрес:* {$data['address']}\n" : "") .
"*Время:* {$data['time']}
" . ($data['urgent'] ? "⚡ *СРОЧНЫЙ ВЫЗОВ*\n" : "") .
"*Детали:* {$data['details']}

*Клиент TG:* " . ($data['username'] ? "@{$data['username']}" : "ID: {$data['userId']}") . "
*Источник:* Mini App
";
}

function sendTelegramMessage($token, $chatId, $message) {
    $url = "https://api.telegram.org/bot$token/sendMessage";
    
    $data = [
        'chat_id' => $chatId,
        'text' => $message,
        'parse_mode' => 'Markdown'
    ];
    
    $options = [
        'http' => [
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data)
        ]
    ];
    
    $context = stream_context_create($options);
    file_get_contents($url, false, $context);
}
?>