### **1\. Authentication & Core**

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-00: User Authentication & Authorization |
| **Description** | The system authenticates users via Social Login (OAuth 2.0) or email/password, issues JWT tokens, and enforces role-based access control. |
| **Actors** | Parent, Child (via linked profile), Administrator |
| **Pre-conditions** | Internet connection available; Device supports modern browser (Chrome, Safari, Edge). |
| **Post-conditions** | Secure JWT token stored (HttpOnly cookie or secure storage); Active session; Redirect to role-specific dashboard. |
| **Main Success Scenario** | 1\. User selects login method (Google/Facebook or email/password). 2\. System redirects to OAuth provider or validates credentials. 3\. JWT token issued \+ role-based redirect (Parent → Portal, Learner → Learning Dashboard, Admin → CMS). 4\. Logout: Token revoked, redirect to landing page. |
| **Exceptions / Alternative Flows** | \- Invalid credentials → Display “Incorrect information”. \- OAuth token expired → “Session expired, please log in again”. \- Rate limiting triggered → Account temporarily locked for 5 minutes after 5 failed attempts. |
| **Relationships** | Generalization: Precondition for most other use cases. |
| **Linked NFR & Tech** | NFR-03 (HTTPS/TLS 1.3, OAuth 2.0 \+ secure JWT); Nest.js Auth module \+ Prisma. |

### **2\. Learner Module**

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-01: View Immersive Vocabulary Content |
| **Description** | Child selects a topic and views combined static/animated flashcards \+ short animated video lessons. |
| **Actors** | Child (Learner) |
| **Pre-conditions** | Logged in to Learner profile; Internet connection available. |
| **Post-conditions** | Content displayed; Viewing progress updated (if completed). |
| **Main Success Scenario** | 1\. Child selects vocabulary topic. 2\. System displays flashcards \+ short video. 3\. Child interacts (view, listen). |
| **Exceptions** | Media loading fails → Show placeholder \+ friendly message “Connection is slow, try again\!”. |
| **Relationships** | \<\<include\>\> UC-02 (Interactive Flashcards). |
| **Linked NFR & Tech** | NFR-04 (responsive design); Next.js \+ Cloudinary CDN. |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-02: Interact with Flashcards |
| **Description** | Child interacts with high-quality image flashcards, native audio, and drag-and-drop elements for active recall. |
| **Actors** | Child |
| **Pre-conditions** | Inside a vocabulary topic. |
| **Post-conditions** | Interaction results saved; Potential Star Points awarded. |
| **Main Success Scenario** | 1\. System displays flashcard (image \+ text). 2\. Child plays native audio. 3\. Performs drag-and-drop activity. 4\. Immediate correct/incorrect feedback. |
| **Exceptions** | Audio playback fails → Fallback to browser TTS \+ notification. |
| **Relationships** | \<\<extend\>\> UC-03 (AI Pronunciation). |
| **Linked NFR & Tech** | NFR-01 (response \<500ms); Redis caching for vocabulary lists. |

| Field | Content |
| :---- | :---- |
| **Use Case ID & Name** | UC-03: Practice Pronunciation with AI |
| **Description** | Child practices pronunciation by speaking a word into the microphone. The browser evaluates pronunciation using Web Speech API and sends the confidence score to the backend, which converts the score into kid-friendly feedback (stars, icons) and updates learning progress. |
| **Actors** | Child (Learner) |
| **Pre-conditions** | Learner profile selected and active; Microphone available and permission granted; Internet connection available. |
| **Post-conditions** | Pronunciation score recorded; Learning progress updated if score improves; Gamification rewards triggered when applicable. |
| **Main Success Scenario** | 1\. Child selects vocabulary word.2. System plays native pronunciation audio.3. Child records pronunciation (5–10 seconds).4. Browser evaluates pronunciation using Web Speech API.5. Browser sends confidence score to backend API.6. Backend converts score to star rating and feedback.7. Learning progress and rewards updated. |
| **Exceptions / Alternative Flows** | Low signal-to-noise ratio → Show message “The sound isn’t clear, please try again in a quiet place.”Microphone permission denied → System asks user to enable microphone permission. |
| **Relationships** | \<\> UC-02 Interact with Flashcards\<\> UC-05 Receive Gamification Rewards |
| **Linked NFR & Tech** | NFR-03 (child privacy – audio not stored permanently); Web Speech API (client side); Nest.js API for saving confidence score |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-04: Take Adaptive Quiz |
| **Description** | The system generates quizzes based on vocabulary topics. Quiz difficulty adapts according to the learner’s historical performance and error rates to maintain appropriate challenge level. |
| **Actors** | Child (Learner) |
| **Pre-conditions** | Learner completed at least one lesson; Vocabulary data available. |
| **Post-conditions** | Quiz score calculated and stored; Learning progress updated; Gamification rewards triggered. |
| **Main Success Scenario** | 1\. Child starts quiz.2. System selects vocabulary questions.3. Difficulty adjusted using learner history.4. Child answers questions.5. System calculates score.6. Results and rewards displayed. |
| **Exceptions** | Quiz data fails to load → System switches to static quiz version. |
| **Relationships** | \<\> UC-05 Receive Gamification Rewards |
| **Linked NFR & Tech** | NFR-01 (response \<500ms); Quiz logic in Nest.js backend; Prisma database queries for learner history |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-05: Receive and Use Gamification Rewards |
| **Description** | Child earns Star Points and Badges; spends them in Virtual Shop to customize avatar. |
| **Actors** | Child |
| **Pre-conditions** | Completed lesson/quiz/pronunciation task. |
| **Post-conditions** | Profile updated; Increased motivation. |
| **Main Success Scenario** | 1\. Award points/badges upon completion. 2\. Enter Virtual Shop. 3\. Purchase and apply item to avatar. |
| **Exceptions** | Insufficient points → Friendly prompt “Keep going\!”. |
| **Relationships** | \<\<include\>\> from UC-03, UC-04. |
| **Linked NFR & Tech** | NFR-04 (responsive UI). |

### 

### **3\. Parent Portal**

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-06: Manage Multi-Child Profiles |
| **Description** | Parent creates and switches between multiple child profiles under one account. |
| **Actors** | Parent |
| **Pre-conditions** | Logged in via social/email. |
| **Post-conditions** | Child profiles linked and manageable. |
| **Main Success Scenario** | 1\. Login. 2\. Create new child profile (nickname, age). 3\. Switch between profiles. |
| **Exceptions** | Login failure → Fallback method. |
| **Relationships** | — |
| **Linked NFR & Tech** | NFR-03 (OAuth 2.0). |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-07: View AI Analytics Dashboard |
| **Description** | Parent views charts of learning time, vocabulary retention, pronunciation accuracy. |
| **Actors** | Parent |
| **Pre-conditions** | At least one child profile active. |
| **Post-conditions** | Insights displayed. |
| **Main Success Scenario** | 1\. Enter Parent Portal. 2\. Select child profile. 3\. View visualized analytics. |
| **Exceptions** | No data → “No data yet – encourage your child to learn\!”. |
| **Relationships** | — |
| **Linked NFR & Tech** | NFR-01 (Redis caching for fast charts). |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-08: Receive Automated Progress Reports |
| **Description** | System automatically generates and sends weekly progress reports via Email or Zalo. |
| **Actors** | Parent (passive) |
| **Pre-conditions** | Subscribed to reports. |
| **Post-conditions** | Report successfully delivered. |
| **Main Success Scenario** | 1\. Weekly scheduler generates report. 2\. Send via Email or Zalo API. |
| **Exceptions** | Invalid email → Fallback to in-app notification. |
| **Relationships** | — |
| **Linked NFR & Tech** | NFR-02 (high uptime for scheduler). |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-09: View and Apply Personalized Learning Path Recommendations |
| **Description** | Parent reviews AI suggestions and applies tailored topics/review sessions. |
| **Actors** | Parent |
| **Pre-conditions** | Sufficient learning data available. |
| **Post-conditions** | Updated learning path for the child profile. |
| **Main Success Scenario** | 1\. View recommendations on dashboard. 2\. Apply selected suggestions. |
| **Exceptions** | No recommendations → “Continue regular learning\!”. |
| **Relationships** | — |
| **Linked NFR & Tech** | NFR-01 (AI computation). |

### 

### **4\. Administrator Dashboard**

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-10: Manage Content via CMS |
| **Description** | Admin creates, updates, deletes topics, vocabulary items, and quiz structures. |
| **Actors** | Administrator |
| **Pre-conditions** | Logged in as admin. |
| **Post-conditions** | Content updated and live (if published). |
| **Main Success Scenario** | 1\. Access CMS interface. 2\. Perform CRUD operations. 3\. Save and publish. |
| **Exceptions** | Invalid data → Validation error message. |
| **Relationships** | \<\<include\>\> UC-14 (Content Validation & Preview). |
| **Linked NFR & Tech** | NFR-03 (JWT admin security). |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-11: Automated Media Upload & Processing |
| **Description** | Admin uploads media assets (images, audio, video). The system processes media asynchronously to optimize file size, convert formats, and generate delivery URLs. |
| **Actors** | Administrator |
| **Pre-conditions** | Admin authenticated; Media file prepared for upload. |
| **Post-conditions** | Optimized media stored in cloud storage; Delivery URLs generated. |
| **Main Success Scenario** | 1\. Admin uploads media via CMS.2. Backend stores raw file temporarily.3. Async worker processes file (compression, format conversion).4. Media uploaded to Cloudinary/AWS S3.5. Delivery URLs generated and saved. |
| **Exceptions** | File exceeds allowed size → Upload rejected or resized automatically. |
| **Relationships** | None |
| **Linked NFR & Tech** | NFR-01 (asynchronous processing); Cloudinary / AWS S3 storage; Background worker queue (BullMQ \+ Redis) |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-12: View Platform Analytics |
| **Description** | Admin views system-wide metrics: DAU, average session length, content popularity. |
| **Actors** | Administrator |
| **Pre-conditions** | Usage data available. |
| **Post-conditions** | Metrics displayed. |
| **Main Success Scenario** | 1\. Access admin dashboard. 2\. Select metric. 3\. View charts/rankings. |
| **Exceptions** | Insufficient data → “Not enough data yet”. |
| **Relationships** | — |
| **Linked NFR & Tech** | NFR-01 (Redis for real-time analytics). |

### 

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-13: Synchronization of Learning Progress |
| **Description** | The system synchronizes learner progress data (points, badges, scores) across devices to ensure consistent learning records. |
| **Actors** | Child (primary), Parent (viewer) |
| **Pre-conditions** | Learner authenticated; Internet connection available or offline queue enabled. |
| **Post-conditions** | All active devices display consistent progress data within a short delay. |
| **Main Success Scenario** | 1\. Learner completes activity.2. Client sends progress update to backend API.3. Backend validates and stores update.4. Update synchronized to other sessions.5. Parent dashboard reflects updated data. |
| **Exceptions** | Offline → Changes queued locally and synchronized later.Data conflict → Last-write-wins rule applied. |
| **Relationships** | \<\> Learner module use cases |
| **Linked NFR & Tech** | Redis caching; REST synchronization with optional WebSocket broadcasting; Prisma persistence |

### 

### **5\. Additional Critical Use Cases**

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-13: Synchronization of Learning Progress |
| **Description** | Real-time synchronization of progress (Star Points, Badges, scores) across devices. |
| **Actors** | Child (primary), Parent (viewer) |
| **Pre-conditions** | Logged in; Internet available (or offline queue supported). |
| **Post-conditions** | All active devices synchronized within \<5 seconds. |
| **Main Success Scenario** | 1\. Local update after action. 2\. Send to server via WebSocket. 3\. Server validates & broadcasts to other sessions. |
| **Exceptions** | Offline → Queue changes locally; sync on reconnect. Conflict → Last-write-wins policy. |
| **Relationships** | \<\<extend\>\> for Learner use cases (multi-device support). |
| **Linked NFR & Tech** | NFR-01 (scalability with Redis/WebSocket); Prisma \+ Redis. |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-14: Media Content Validation & Preview |
| **Description** | Admin previews and approves content before publishing to ensure child safety and quality. |
| **Actors** | Administrator |
| **Pre-conditions** | Media uploaded via UC-11. |
| **Post-conditions** | Content approved → live; Rejected → notified with reason. |
| **Main Success Scenario** | 1\. Select draft item in CMS. 2\. Render preview mode (with watermark). 3\. Review visuals, audio, text. 4\. Approve or Reject. |
| **Exceptions** | Auto-flagging (unsafe content) → Automatic block. |
| **Relationships** | \<\<include\>\> UC-10 (CMS Management). |
| **Linked NFR & Tech** | NFR-03 (zero-tolerance child safety). |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-15: Customize Avatar |
| **Description** | Learners personalize their avatar using items purchased from the virtual shop. |
| **Actors** | Child (Learner) |
| **Pre-conditions** | Learner owns avatar customization items. |
| **Post-conditions** | Avatar appearance updated and saved. |
| **Main Success Scenario** | 1\. Child opens avatar customization screen.2. System displays owned items.3. Child selects item.4. Avatar preview updates.5. Changes saved. |
| **Exceptions** | Item not owned → System prompts purchase from shop first. |
| **Relationships** | \<\> UC-05 Receive Gamification Rewards |
| **Linked NFR & Tech** | Gamification module; Avatar customization UI |

| Field | Content |
| ----- | ----- |
| **Use Case ID & Name** | UC-16: Review Vocabulary |
| **Description** | The system schedules vocabulary review sessions using spaced repetition to improve long-term retention. |
| **Actors** | Child (Learner) |
| **Pre-conditions** | Learner previously studied vocabulary items. |
| **Post-conditions** | Review results recorded; Next review interval updated. |
| **Main Success Scenario** | 1\. System generates review list using spaced repetition algorithm.2. Child reviews vocabulary items.3. Child answers recall questions.4. System updates repetition interval and progress. |
| **Exceptions** | No items due for review → System suggests learning new vocabulary. |
| **Relationships** | \<\> UC-01 View Vocabulary Content |
| **Linked NFR & Tech** | Spaced repetition algorithm; Prisma database review scheduling |

