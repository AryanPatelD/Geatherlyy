require('dotenv').config();
const url = process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL not found");
} else {
  try {
    const u = new URL(url);
    console.log("Protocol:", u.protocol);
    console.log("Hostname:", u.hostname);
    console.log("Port:", u.port);
    console.log("Search attributes:", u.search);
  } catch (e) {
    console.log("Error parsing URL:", e.message);
  }
}
