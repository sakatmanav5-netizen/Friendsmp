# FriendSMP Hub

"Hey AI, I want you to build a fully functional, production-ready, ultra-premium Minecraft Server website based 100% exactly on the attached UI screenshot for 'FriendSMP'.There must be 0% deviation from the image layout, colors, typography, glowing elements, grid structures, or sidebar menus. Everything visible in the image must be fully responsive and functional.Here are the strict design and technical specifications:1. VISUAL FRONTEND & PIXEL-PERFECT LAYOUT (Strict Match)Theme: Dark cyber/esports theme. Pitch black (#000000) background with vibrant deep-purple glowing canvas overlays, neon-blue text highlights, and frosted-glass panel components (backdrop-filter: blur).Left Fixed Sidebar Navigation: Exact replica of the menu containing Home, Store, Ranks, Crate Keys, Coins, News, Staff, and About with custom neon hover states. Bottom displays 'Guest / Join Now' status.Main Hero Banner:Dynamic top navigation with Server Online green pulse dot indicator and a neon-purple floating Join Server button.Large title card displaying 'FriendSMP' and text "The Ultimate Minecraft Survival Experience".Functional Copy IP button that copies the server IP address to clipboard and fires a custom polished 'IP Copied!' toast notification.Right-side dedicated Live Players Box rendering the real-time active counter (247) with a custom smooth neon analytics wave/line graph.Store Cards Grid ('Our Store'):Card 1 (Ranks): Purple neon border glow, heading Ranks (VIP • MVP • Legend) with a glowing 'Explore →' button.Card 2 (Crate Keys): Deep cyan-blue neon glow container showing crate boxes, heading Crate Keys (Epic • Vote • Monthly) with a 'View Keys →' button.Card 3 (Coins): Dark slate layout with soft gold/orange gradient border glow, heading Coins (100 • 500 • 1000 packs) with a 'Buy Coins →' button.News & Bottom Modules: Full-width horizontal banner displaying Latest News | Event text (Double XP Weekend...) with 'Read More' link, matched precisely with the dark footer.

2. HIDDEN ADVANCED ADMIN CMS (OWNER EDIT MODE)Access Control: The entire website customizer must be completely hidden from regular visitors. Build a hidden login route or a discrete secure portal shortcut (accessible via a custom key combination like Ctrl + Shift + A or a secure path).Visual Editor Engine: Once the Owner/Staff logs in, they must unlock a fully editable visual inline mode:Ability to directly edit text strings, change brand names, upload new card background images, resize components, and swap out the neon theme colors (e.g., Purple to Emerald Green).An Access Management section inside the hidden dashboard allowing the Owner to grant or revoke editor permissions to other specific staff accounts.All edits must be persistent and stored securely using persistent configurations or local databases.3. RCON MINECRAFT PLUGIN INTEGRATION (AUTOMATED IN-GAME DELIVERY)Configure a backend store module inside the checkout sequence that connects directly via RCON protocol to the Minecraft Server.When a player purchases a package (Ranks, Crate Keys, or Coins), the script must execute the specified RCON commands automatically (e.g., /lp user [username] parent add vip or /crate give [username] epic 5).4. USERNAME-SAFE PREMIUM PAYMENT & REFUND DASHBOARDSafe Checkout Verification: Before any payment goes through, the system must strictly require the user to input their exact Minecraft Username.Transaction Logs & Manual Refund Portal: Inside the hidden Owner Admin Dashboard, build a secure 'Transaction Management Ledger'. It must log every payment timestamp, transaction ID, paid amount, package selected, and the input Minecraft Username.Refund mechanism: If a player inputs a wrong username or makes a mistake, the Owner must be able to view their transaction inside the admin log and trigger a dedicated 'Issue Refund & Revoke Package' sequence which logs the state and initiates a clear rollback (stopping RCON item access).Generate the full-stack system architecture using production-grade code, providing a seamless live deployment flow."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://friendsmp.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a3594e7d-08cd-4795-bd3b-b106299a0935).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
