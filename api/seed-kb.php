<?php
require_once 'db-config.php';

$content = [
    "core" => [
        ["title" => "Start Trigger", "icon" => "Zap", "description" => "The entry point for every workflow. Can be a manual trigger, a scheduled event, or a Webhook URL that listens for external data.", "color" => "text-amber-400"],
        ["title" => "If / Else", "icon" => "Activity", "description" => "Advanced branching logic. Allows you to compare variables (equal to, contains, exists) and split the workflow path based on the result.", "color" => "text-red-400"],
        ["title" => "Context Memory", "icon" => "Shield", "description" => "Saves and retrieves data across different workflow runs or steps. Essential for maintaining state in complex multi-step processes.", "color" => "text-amber-500"],
        ["title" => "Recruit Workflow", "icon" => "Wand2", "description" => "Allows one workflow to call another. This modular approach helps in building scalable and reusable automation blocks.", "color" => "text-blue-500"]
    ],
    "flow" => [
        ["title" => "Wait / Delay", "icon" => "Clock", "description" => "Pauses the workflow for a specified duration (seconds, minutes, or hours). Useful for rate-limiting or waiting for external processes.", "color" => "text-rose-400"],
        ["title" => "Merge Paths", "icon" => "ArrowRightLeft", "description" => "Combines multiple branches back into a single stream. Essential after an If/Else branch if both paths eventually need to perform the same task.", "color" => "text-cyan-400"],
        ["title" => "Split In Batches", "icon" => "Activity", "description" => "Iterates over a list of items. It splits a large array into smaller chunks and processes them one by one until the list is exhausted.", "color" => "text-emerald-400"]
    ],
    "plugins" => [
        ["title" => "AI Model", "icon" => "Brain", "description" => "Connects to LLMs (GPT-4, Claude, etc.) to summarize, classify, or generate content based on your custom prompts.", "color" => "text-purple-500"],
        ["title" => "AI BPO Agent", "icon" => "Monitor", "description" => "Integrates with Voice AI agents like Vapi. Ideal for automating call center operations and customer support.", "color" => "text-indigo-400"],
        ["title" => "User App", "icon" => "Monitor", "description" => "Creates a custom UI interface for end-users to interact with the workflow (forms, review screens, dashboards).", "color" => "text-pink-500"],
        ["title" => "Web Scraper", "icon" => "Search", "description" => "Automates browser actions to extract data from websites, click buttons, or take screenshots.", "color" => "text-orange-400"],
        ["title" => "External API", "icon" => "Webhook", "description" => "Makes HTTP requests (GET, POST, PUT, DELETE) to any external service or third-party API.", "color" => "text-blue-500"]
    ],
    "builder" => [
        ["title" => "JSON Source View", "icon" => "FileCode", "description" => "Switch to a professional code editor view to see the raw structure of your workflow. Perfect for advanced users to copy-paste entire architectures.", "color" => "text-blue-400"],
        ["title" => "Auto-Healing", "icon" => "Zap", "description" => "The builder automatically fixes invalid coordinates, maps legacy types, and sanitizes data structures during imports.", "color" => "text-amber-400"],
        ["title" => "Sync to DB", "icon" => "Save", "description" => "Instantly pushes your local changes to the enterprise cloud ledger, versioning your workflow as you go.", "color" => "text-emerald-400"],
        ["title" => "AI Optimizer", "icon" => "Wand2", "description" => "Use AI to analyze your prompt and generate a full multi-node workflow architecture in seconds.", "color" => "text-primary"]
    ]
];

foreach ($content as $sid => $data) {
    $json = json_encode($data);
    $stmt = $pdo->prepare("INSERT INTO knowledge_base (section_id, content_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE content_json = ?");
    $stmt->execute([$sid, $json, $json]);
}

echo "Knowledge Base seeded.";
?>
