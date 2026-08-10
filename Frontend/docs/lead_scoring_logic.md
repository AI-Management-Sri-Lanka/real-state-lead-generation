# Lead Scoring & Priority Logic

The priority of leads (High, Medium, Low) in the Real Estate Lead Generation system is calculated dynamically using a **point-scoring algorithm** that analyzes the text of the user's inquiry message. 

The system initializes each lead with **0 points** and evaluates the text against 5 key criteria, adding or subtracting points accordingly.

---

## 1. Message Length Weight
The length of the inquiry serves as a baseline indicator of user effort and intent.
- **Under 15 characters:** Subtracts 2 points (`-2`) *(Considered too short/low effort)*
- **Over 50 characters:** Adds 1 point (`+1`)
- **Over 100 characters:** Adds 1 additional point (`+1`) *(Total +2 for highly detailed messages)*

## 2. Timeline & Urgency Intent
The system detects if the user is looking to act quickly by scanning for urgency keywords.
- **Criteria:** Message contains words like: `immediate`, `urgent`, `ready`, `now`, `quick`, `asap`, `this week`, `next month`, `soon`.
- **Points:** Adds 2 points (`+2`)

## 3. Financial & Buying Intent
Assesses if the user is discussing financial terms, which typically indicates a higher likelihood of a serious transaction.
- **Criteria:** Message contains words like: `buy`, `purchase`, `invest`, `budget`, `price`, `cash`, `loan`, `mortgage`, `$`, `aud`, `rs`, `lkr`, `usd`.
- **Points:** Adds 2 points (`+2`)

## 4. Specificity & Property Terms
Identifies if the user is asking about specific property details or is requesting an action like a tour.
- **Criteria:** Message contains words like: `bedroom`, `bathroom`, `sqft`, `viewing`, `inspect`, `tour`, `visit`, `location`.
- **Points:** Adds 1 point (`+1`)

## 5. Verified Buyer Qualification
If a lead contacts you via the **Property Detail Page Questionnaire** or the **Contact Page Form**, they are asked a series of pre-qualification questions regarding their financial readiness. The backend scans the submitted form answers for specific "top-tier" financial responses, which indicates a highly qualified, mortgage-ready buyer.

If the system detects any of the following top-tier answers, the lead receives a massive point boost:

- **Income (Single/Combined):** Answers of `$120K – $150K`, `$150K – $180K`, or `$180K+` 
- **Property Equity:** Answer of `Yes, with $300K+ equity`
- **Deposit Savings:** Answers of `Yes – $40K–$50K (First Home Buyer)` or `Yes – $80K+ (Investor)`
- **Superannuation:** Answering `Yes` to having `$230K or more in Superannuation`

*(Note: The system scans the raw text of the inquiry message for the specific substring values: `120k`, `150k`, `180k+`, `300k+ equity`, `yes – $40k`, `yes – $80k+`, and `superannuation ($230k+): yes`)*

- **Points:** Adds a flat 3 points (`+3`)

*(Important Note on Stacking: This +3 point boost does NOT stack. If a user provides multiple top-tier answers—such as having both high income AND a large deposit—the system still only awards a flat +3 points total for this section. However, because 3 points is the exact threshold required to achieve a High Priority status, having even one top-tier qualification guarantees they are marked as a High Priority lead.)*

**Example Scoring Scenario (Questionnaire Lead):**
**Message:** *"Income: $180K+ | Deposit: Yes – $80K+ (Investor) | Property Equity: No"*
**Scoring Breakdown:**
* `180k+` (Verified Buyer Qualification) -> **+3**
* `yes – $80k+` (Verified Buyer Qualification) -> **+0** *(Does not stack with the first +3)*
* `invest` (Financial Intent inside "Investor" text) -> **+2**
* Length over 50 chars -> **+1**

**Total Points:** 6
**Result:** 🟢 **High Priority**

---

## Final Priority Classification
After the points from all 5 criteria are tallied, the system assigns the final priority tag based on the total score:

*   🟢 **High Priority:** Total score is **3 points or more**.
*   🟡 **Medium Priority:** Total score is **1 or 2 points**.
*   🔴 **Low Priority:** Total score is **0 points or less** (or if the message is empty/missing).

### Example Scoring Scenario
**Message:** *"I am looking to **buy** a 3 **bedroom** house in the area and have a **budget** of $800k. Can we arrange a **viewing** **soon**?"*

**Scoring Breakdown:**
* `buy`, `budget` (Financial Intent) -> **+2**
* `bedroom`, `viewing` (Specificity) -> **+1**
* `soon` (Urgency) -> **+2**
* Length is over 50 characters -> **+1**

**Total Points:** 6
**Result:** 🟢 **High Priority**
