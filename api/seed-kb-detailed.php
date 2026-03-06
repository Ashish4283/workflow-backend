<?php
require_once 'db-config.php';

$content = [
    "core" => [
        [
            "title" => "Start Trigger",
            "icon" => "Zap",
            "description" => "The foundation of your workflow. \n\nHOW TO CONFIGURE:\n1. Open Settings: Double-click the node.\n2. Choose Type: Select \"Webhook\", \"Manual\", or \"Schedule\".\n3. Webhook URL: Copy the generated URL to external apps.",
            "color" => "text-amber-400",
            "deepDive" => [
                "overview" => "What is a Start Trigger?\nThe Start Trigger is the genesis node of every Horizon Workflow. Without a Start Trigger, a workflow cannot be executed. It defines HOW and WHEN an automation begins. All workflows MUST contain exactly one Start Trigger.",
                "sections" => [
                    [
                        "title" => "Section 1: Trigger Types",
                        "content" => "1. Manual Run: The workflow is triggered by an explicit action from a human user inside the dashboard or via an App UI.\n\n2. Schedule (Cron): The workflow runs automatically based on a time interval (e.g., every 15 minutes, or every Sunday at 3 AM). Best used for report generation, data scraping, or periodic syncs.\n\n3. Webhook (Event-Driven): You receive a unique Webhook URL. Whenever an external service (like Stripe, Shopify, or a custom application) sends a POST request with data to this URL, the workflow instantly activates, capturing the incoming JSON."
                    ],
                    [
                        "title" => "Section 2: Node Configuration",
                        "content" => "Double-click the Start Trigger node on the canvas to open its Inspector panel. Here, you will see:\n\n- Label: You can rename the trigger (e.g., 'Shopify Order Received').\n- Type Selector: Choose between the 3 main types mentioned above.\n- URL / Payload Preview: If Webhook is selected, you can copy the URL and define the expected JSON schema to help autocomplete variables downstream."
                    ],
                    [
                        "title" => "Section 3: Troubleshooting Issues",
                        "content" => "Problem: My Webhook isn't starting the workflow.\nFixes:\n- Ensure the external app is sending a 'POST' request, not a GET request.\n- Check if the JSON payload is properly formatted. Malformed JSON will be rejected by the API Gateway.\n- Verify the workflow is not set to 'Inactive'.\n\nProblem: Manual run says 'Validation Error'.\nFixes:\n- Check if you have left any nodes disconnected. A Start Trigger must have an outbound connection line going to the next logical step."
                    ]
                ]
            ]
        ],
        [
            "title" => "If / Else",
            "icon" => "Activity",
            "description" => "Intelligent decision making based on data conditions.",
            "color" => "text-red-400",
            "deepDive" => [
                "overview" => "What is an If / Else Node?\nThis node allows your workflow to branch into different paths based on incoming data. It acts as the logical crossroad of the process builder.",
                "sections" => [
                    [
                        "title" => "Configuration",
                        "content" => "- Value 1: The input variable to test, usually selected from a previous node (e.g., {{stripe.amount}}).\n- Operator: Standard comparison operators (Equals, Not Equals, Greater Than, Contains, Is Empty).\n- Value 2: The static or dynamic value to compare against (e.g., 1000)."
                    ],
                    [
                        "title" => "Routing Actions",
                        "content" => "If the condition evaluates to TRUE, the token flows out of the Green handle. If FALSE, the token flows out of the Red handle. You must connect distinct downstream nodes to both handles to handle each outcome."
                    ]
                ]
            ]
        ],
        [
            "title" => "Context Memory",
            "icon" => "Shield",
            "description" => "The persistent memory layer of your workflow agent.",
            "color" => "text-amber-500",
            "deepDive" => [
                "overview" => "What is Context Memory?\nA key/value store that persists across workflow executions, allowing your agents to 'remember' data about users or states between separate runs.",
                "sections" => [
                    [
                        "title" => "Storing Data",
                        "content" => "Set operation to 'Store', define a unique Key (like 'user_email_123_history'), and pass the value you wish to remember. The value can be a string or a complex JSON object."
                    ],
                    [
                        "title" => "Reading Data",
                        "content" => "Set operation to 'Read' and input the exact Key used previously. The node will fetch the latest saved context from the vault and output it into the workflow runtime for AI models or logical checks."
                    ]
                ]
            ]
        ]
    ],
    "flow" => [
        [
            "title" => "Wait / Delay",
            "icon" => "Clock",
            "description" => "Control the timing of your operations.",
            "color" => "text-rose-400"
        ],
        [
            "title" => "Data Transformation",
            "icon" => "Database",
            "description" => "Manipulate complex JSON objects and arrays natively.",
            "color" => "text-indigo-500"
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
