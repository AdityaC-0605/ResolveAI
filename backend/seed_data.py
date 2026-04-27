from retrieval import HybridRetriever

COMPLAINT_SEED_DATA = [
    {
        "id": "comp_001",
        "text": "I was charged twice for my monthly subscription. I see two charges of $49.99 on my credit card statement dated March 15th. This is unacceptable and I need an immediate refund.",
        "metadata": {"category": "Billing", "subcategory": "double-charge", "urgency": "high"}
    },
    {
        "id": "comp_002", 
        "text": "The app keeps crashing every time I try to upload a photo. I've reinstalled it three times already. I'm on iPhone 14 Pro with iOS 17.4. This has been happening for a week.",
        "metadata": {"category": "Technical", "subcategory": "app-crash", "urgency": "medium"}
    },
    {
        "id": "comp_003",
        "text": "I ordered a blue XL shirt but received a red medium. The order number is #ORD-78234. I need the correct item shipped express since this was a gift for tomorrow.",
        "metadata": {"category": "Shipping", "subcategory": "wrong-item", "urgency": "high"}
    },
    {
        "id": "comp_004",
        "text": "Someone accessed my account and changed the email address. I can no longer log in and I see purchases I didn't make. This is a security breach!",
        "metadata": {"category": "Fraud-Security", "subcategory": "account-takeover", "urgency": "critical"}
    },
    {
        "id": "comp_005",
        "text": "Your customer service representative was extremely rude and hung up on me. I was just asking about my warranty status. This is no way to treat loyal customers.",
        "metadata": {"category": "Service", "subcategory": "rude-agent", "urgency": "medium"}
    },
    {
        "id": "comp_006",
        "text": "The laptop I bought last month has a flickering screen and the battery only lasts 2 hours. This is clearly defective. I want a replacement not a repair.",
        "metadata": {"category": "Product-Quality", "subcategory": "defective-item", "urgency": "high"}
    },
    {
        "id": "comp_007",
        "text": "I can't reset my password. The reset email never arrives. I've checked spam folder and tried 5 times over 3 days. My account is completely locked out.",
        "metadata": {"category": "Account", "subcategory": "password-reset", "urgency": "high"}
    },
    {
        "id": "comp_008",
        "text": "My refund was promised within 5-7 business days but it's been 3 weeks. Where is my money? I have a reference number REF-99123.",
        "metadata": {"category": "Billing", "subcategory": "refund-delay", "urgency": "medium"}
    },
    {
        "id": "comp_009",
        "text": "The wifi router keeps disconnecting every 10 minutes. All my smart home devices go offline. I've tried factory reset and firmware update. Nothing works.",
        "metadata": {"category": "Technical", "subcategory": "connectivity", "urgency": "high"}
    },
    {
        "id": "comp_010",
        "text": "I was promised a 20% discount as a first-time buyer but the code didn't work at checkout. Your website is misleading and I feel scammed.",
        "metadata": {"category": "Billing", "subcategory": "promo-code", "urgency": "low"}
    },
    {
        "id": "comp_011",
        "text": "Package arrived completely crushed. The glass items inside are shattered. The box was clearly mishandled during shipping. I need full compensation.",
        "metadata": {"category": "Shipping", "subcategory": "damaged-package", "urgency": "high"}
    },
    {
        "id": "comp_012",
        "text": "I see suspicious login attempts from Russia and Brazil on my account. I have 2FA enabled but I'm still getting these alerts. Please secure my account immediately.",
        "metadata": {"category": "Fraud-Security", "subcategory": "suspicious-activity", "urgency": "critical"}
    }
]

def seed_database():
    retriever = HybridRetriever()
    texts = [item["text"] for item in COMPLAINT_SEED_DATA]
    ids = [item["id"] for item in COMPLAINT_SEED_DATA]
    metadatas = [item["metadata"] for item in COMPLAINT_SEED_DATA]
    
    retriever.add_documents(texts, ids, metadatas)
    print(f"Seeded {len(texts)} complaints into hybrid retrieval system.")
    return retriever

if __name__ == "__main__":
    seed_database()