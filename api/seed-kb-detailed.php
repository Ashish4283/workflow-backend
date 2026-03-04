<?php
require_once 'db-config.php';

$content = [
    "core" => [
        [
            "title" => "Start Trigger",
            "icon" => "Zap",
            "description" => "The foundation of your workflow. \n\nHOW TO CONFIGURE:\n1. Open Settings: Double-click the node.\n2. Choose Type: Select \"Webhook\" for instant data, \"Manual\" for button-starts, or \"Schedule\" for periodic tasks.\n3. Webhook URL: Copy the generated URL to external apps (like Shopify or Stripe) to send data into Creative 4 AI.\n\nPRO TIP: Use \"{{trigger.id}}\" in subsequent nodes to reference the incoming data.",
            "color" => "text-amber-400"
        ],
        [
            "title" => "If / Else",
            "icon" => "Activity",
            "description" => "Intelligent decision making.\n\nHOW TO CONFIGURE:\n1. Value 1: Use the variable picker or type \"{{data.field_name}}\".\n2. Operator: Choose \"Equals\", \"Contains\", \"Greater Than\", etc.\n3. Value 2: The static value or variable to compare against.\n\nACTION: Connect nodes to the Green handle (True) and Red handle (False).",
            "color" => "text-red-400"
        ],
        [
            "title" => "Context Memory",
            "icon" => "Shield",
            "description" => "The short-term memory of your agent.\n\nHOW TO CONFIGURE:\n1. Operation: Set to \"Store\" to save data, or \"Read\" to fetch it.\n2. Key Name: A unique name (e.g., \"customer_history\").\n3. Value: The information you want to save.\n\nUSE CASE: Saving a user's name in a multi-step conversation so the AI can use it later.",
            "color" => "text-amber-500"
        ],
        [
            "title" => "Recruit Workflow",
            "icon" => "Wand2",
            "description" => "Call a sub-process inside your main flow.\n\nHOW TO CONFIGURE:\n1. Select Workflow: Choose from your list of created flows.\n2. Input Mapping: Pass specific data from your current flow into the sub-flow.\n\nPRO TIP: Use this to create reusable modules like \"Global Error Handler\" or \"Data Logger\".",
            "color" => "text-blue-500"
        ]
    ],
    "flow" => [
        [
            "title" => "Wait / Delay",
            "icon" => "Clock",
            "description" => "Control the timing of your operations.\n\nHOW TO CONFIGURE:\n1. Duration: Type a number (e.g., 5).\n2. Unit: Choose Seconds, Minutes, or Hours.\n\nUSE CASE: Waiting 10 minutes before sending a follow-up email to make it feel natural and human-like.",
            "color" => "text-rose-400"
        ],
        [
            "title" => "Merge Paths",
            "icon" => "ArrowRightLeft",
            "description" => "Bringing it all back together.\n\nHOW TO CONFIGURE:\n1. Input Nodes: Connect multiple branches to this single node.\n2. Mode: Set to \"Wait for All\" if you need data from every branch, or \"First Come\" to continue as soon as one branch finishes.\n\nUSE CASE: Merging True/False paths of an If/Else node to a final \"Success Message\" node.",
            "color" => "text-cyan-400"
        ],
        [
            "title" => "Split In Batches",
            "icon" => "Activity",
            "description" => "Handle large data lists with ease.\n\nHOW TO CONFIGURE:\n1. Input List: Select the array/list variable you want to loop through.\n2. Batch Size: How many items to process at once (e.g., 10).\n\nACTION: Loop the output back into the input of this node until finished.",
            "color" => "text-emerald-400"
        ]
    ],
    "plugins" => [
        [
            "title" => "AI Model",
            "icon" => "Brain",
            "description" => "Your Generative AI brain.\n\nHOW TO CONFIGURE:\n1. System Prompt: Explain the AI's persona (e.g., \"You are a helpful support agent\").\n2. User Input: Pass the data using \"{{variable}}\".\n3. Model: Choose GPT-4 Omni for complex logic or Claude for creative writing.\n\nPRO TIP: Set \"Temperature\" to 0 for strict facts, or 0.8 for creative ideas.",
            "color" => "text-purple-500"
        ],
        [
            "title" => "AI BPO Agent",
            "icon" => "Monitor",
            "description" => "Voice & Call Center Automation.\n\nHOW TO CONFIGURE:\n1. Agent ID: Paste your Vapi Agent ID.\n2. Greeting: The first thing the AI says on the call.\n3. Phone Number: The destination number or SIP trunk.\n\nUSE CASE: Automatically calling a lead the moment they fill out a website form.",
            "color" => "text-indigo-400"
        ],
        [
            "title" => "User App",
            "icon" => "Monitor",
            "description" => "Create interfaces for humans.\n\nHOW TO CONFIGURE:\n1. Fields: Add \"Text Input\", \"File Upload\", or \"Drop-down\".\n2. Branding: Set the App Title and Logo URL.\n3. Human Review: Enable this to pause the workflow until a human clicks \"Approve\".",
            "color" => "text-pink-500"
        ],
        [
            "title" => "Web Scraper",
            "icon" => "Search",
            "description" => "Extract data from any website.\n\nHOW TO CONFIGURE:\n1. Target URL: The website address.\n2. Action: Choose \"Scrape Content\" (Text only) or \"Screenshot\" (Visual).\n3. Wait Period: Seconds to wait for JavaScript to load.\n\nPRO TIP: Use this to track competitor prices or aggregate news daily.",
            "color" => "text-orange-400"
        ],
        [
            "title" => "External API",
            "icon" => "Webhook",
            "description" => "The bridge to 5000+ other apps.\n\nHOW TO CONFIGURE:\n1. Method: Choose GET (fetch), POST (send), or DELETE.\n2. Headers: Enter API Keys or Auth Tokens here.\n3. Payload: The JSON data to send to the external service.",
            "color" => "text-blue-500"
        ]
    ],
    "builder" => [
        [
            "title" => "JSON Source View",
            "icon" => "FileCode",
            "description" => "The Pro Editor mode.\n\nHOW TO USE:\n1. Click the Blue Icon in the toolbar.\n2. Edit the raw JSON structure.\n3. Click \"Apply\" to rebuild the canvas instantly.\n\nUSE CASE: Migrating a workflow from a sandbox environment to production by copy-pasting code.",
            "color" => "text-blue-400"
        ],
        [
            "title" => "Auto-Healing",
            "icon" => "Zap",
            "description" => "Self-correcting architecture.\n\nFUNCTIONALITY:\nWhenever you paste external JSON, the builder detects missing coordinates, fixes broken node types, and reconnects detached logic automatically to ensure the workflow is \"Render Ready\".",
            "color" => "text-amber-400"
        ],
        [
            "title" => "Sync to DB",
            "icon" => "Save",
            "description" => "Cloud Persistence & Safety.\n\nFUNCTIONALITY:\nEnsures your draft is backed up to the enterprise ledger. If your browser crashes, you can recover the \"Unsynced Draft\" on the next visit.",
            "color" => "text-emerald-400"
        ],
        [
            "title" => "AI Optimizer",
            "icon" => "Wand2",
            "description" => "Zero-Code Flow Generation.\n\nHOW TO USE:\n1. Type your goal (e.g., \"Build a flow that scrapes Amazon and emails me prices\").\n2. Click Generate.\n3. The AI will drop the required nodes and connect them for you.",
            "color" => "text-primary"
        ]
    ]
];

foreach ($content as $sid => $data) {
    $json = json_encode($data);
    $stmt = $pdo->prepare("INSERT INTO knowledge_base (section_id, content_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE content_json = ?");
    $stmt->execute([$sid, $json, $json]);
}

echo "Detailed Knowledge Base sync complete.";
?>
