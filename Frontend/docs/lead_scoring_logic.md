# Lead Scoring & Priority Logic

The priority of leads (High, Medium, Low) in the Real Estate Lead Generation system is calculated dynamically by analyzing the text of the user's inquiry message or their submitted questionnaire answers. 

The system evaluates the text against a strict classification system.

---

## 1. High Priority (Strict "Perfect Buyer" Rule)
To achieve a **High Priority** status, a lead must fill out the **Property Detail Page Questionnaire** or the **Contact Page Form** and provide **ALL THREE** of the following exact answers simultaneously:

1. **Income:** `$180K+`
2. **Property Equity:** `Yes, with $300K+ equity`
3. **Deposit Savings:** `Yes – $40K–$50K (First Home Buyer)`

*(If they select only 1 or 2 of these, or select any other options, they will NOT receive High Priority).*

---

## 2. Medium Priority (Other Verified Options or General Intent)
A lead is tagged as **Medium Priority** if they fall into one of two categories:

**A. Partial Verified Buyer:**
If the lead filled out the form and selected **any** of the verified financial answers (like `$120K`, `$150K`, `Yes – $80K+`, `Superannuation: Yes`, etc.), but did NOT meet the strict "All 3" rule above, they are automatically assigned a Medium Priority.

**B. General Buying Intent:**
If the lead didn't fill out the form (or selected "No" on everything), but their text message demonstrates general buying intent:
- **Timeline & Urgency Intent:** Message contains words like: `immediate`, `urgent`, `ready`, `now`, `quick`, `asap`, `this week`, `next month`, `soon`.
- **Financial & Buying Intent:** Message contains words like: `buy`, `purchase`, `invest`, `budget`, `price`, `cash`, `loan`, `mortgage`, `$`, `aud`, `rs`, `lkr`, `usd`.
- **Specificity & Property Terms:** Message contains words like: `bedroom`, `bathroom`, `sqft`, `viewing`, `inspect`, `tour`, `visit`, `location`.
- **Message Length:** The inquiry is longer than 50 characters (indicating effort).

---

## 3. Low Priority (No Intent)
If the message is very short (under 50 characters) and does **not** contain any of the urgency, financial, or property keywords listed above, it is tagged as **Low Priority**. This also applies to empty or generic messages.
