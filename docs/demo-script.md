## Local Box – 5 Minute Demo Script

Use this script while you record your screen.  
Timestamps are **approximate**, but they help you keep the video close to 5 minutes.

---

### 00:00 – Intro

Hi, my name is \_\_\_\_\_.  
In this video, I will show you my project, **Local Box**.  
The demo will take about five minutes.

---

### 00:20 – What is it?

Local Box is a tool to **share files from a host machine to a client app on the web**.  
You run a **host** on your computer, and your client can open a **website** to see and download the files.  
It also has **tags**, **roles**, and **billing**, so it can work as a real product.

---

### 00:45 – Host and client modes

Now I will explain the two modes.  

- The **host mode** runs on my machine.  
  It can read local files and send them to the cloud.  

- The **client mode** is a website, for example on Netlify.  
  Clients can log in, see the files, and use tags to find what they need.

Host and client talk to each other using a **secure tunnel**.

---

### 01:10 – Setup Docker (host)

Now I will show the **Docker setup** for the host.  

Here you can see the `docker-compose` file.  
To start the host, I run:

“docker compose up”  

This starts the Local Box host with all services it needs, including **Convex** for the database.

---

### 01:35 – Show the login flow

Now I go to the app and show the **login flow**.  

I click **Sign in**.  
Here you can see the auth screen.  
I log in with my test account.  

After login, the app redirects me to the main dashboard.

---

### 01:55 – Upload some files (host)

Now I will **upload some files**.  

I click on the upload button.  
I choose a few files from my computer.  
You can see they appear here in the list, with their status and basic info.

---

### 02:15 – Setup tunnel

Next, I will **set up the tunnel** between the host and the client.  

Here you can see the host connection or tunnel settings.  
I copy the tunnel URL, or I start the tunnel from this screen.  
Now the client app can reach my local host through this URL, even if it runs on the web.

---

### 02:35 – Access the client in Netlify

Now I switch to the **client app**, which is deployed on **Netlify**.  

I open the Netlify URL in the browser.  
This is the same app, but running as a client.  
I log in here as a client user.

---

### 02:55 – Upload from the client

From the client side, I can also **upload files** or interact with the files.  

I click upload, choose a file, and you can see it appears here.  
This file is stored through the host and the Convex backend.

---

### 03:10 – Auto tags system

Now I will show the **auto tags system**.  

When I upload files, the app can automatically add tags based on file type or other rules.  
You can see the tags here next to each file.  
This helps users to quickly filter and search files.

---

### 03:25 – Bulk add tags and delete

We also support **bulk actions**.  

I select multiple files.  
Now I can **add tags to all of them at once**, or **delete many files** in one action.  
This is useful when you manage a lot of content.

---

### 03:40 – Admin panel: roles and tags config

Now I go to the **admin panel**.  

Here an admin user can configure **roles** and **permissions**.  
For example, I can define which users are **admins**, **hosts**, or **clients**.  
I can also configure the **tag categories** and rules for auto-tagging.  

This makes the system flexible for different teams.

---

### 04:00 – Setup the billing

Next, I will show the **billing setup**.  

In the admin or settings area, I can connect to the billing provider.  
Here you can see the plan options and subscription logic.  
Billing is integrated so that only paying users get access to some features.

---

### 04:15 – Show the billing guard

Now I will show the **billing guard** in action.  

When a user without an active subscription tries to open a premium page,  
the billing guard checks their status.  

You can see here: instead of the content, they see a message asking them to **upgrade** or **subscribe**.

---

### 04:30 – Buy the subscription

Now I click to **buy the subscription**.  

This sends me to the checkout flow.  
I complete the payment with a test card.  
After the payment, I come back to the app, and now my account is active.

---

### 04:45 – Access the dashboard

Now that I am subscribed, I can access the **full dashboard**.  

Here I can see my files, tags, and usage.  
I can also access admin tools if my role allows it.

---

### 04:55 – Show data in local Convex instance

Now I will show the **Convex data** behind the scenes.  

Here is the Convex dashboard or local dev tools.  
You can see the collections for **files**, **tags**, **users**, and **billing**.  
All the actions you saw in the UI are stored here in real time.

---

### 05:15 – Mention the hackathon sponsors and Outro

To finish, I want to **thank the hackathon sponsors**.  

Thank you to **[Sponsor 1]**, **[Sponsor 2]**, **[Sponsor 3]**, and all other partners who support this event.  
Your tools and services helped a lot in building Local Box.

This was a quick demo of Local Box:  
a host–client file sharing system with tunnels, tags, roles, and billing, powered by Convex.  

Thank you for watching!


