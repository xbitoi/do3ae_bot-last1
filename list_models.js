const apiKey = "AIzaSyARC2kmxWiKdgHas82XwLZto_h7-sJQpQQ";
async function run() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models) {
      console.log("=== GenerateContent Models ===");
      let i = 1;
      data.models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`${i}. ${m.name.replace('models/', '')} - ${m.displayName || ''}`);
          i++;
        }
      });
    } else {
      console.log(data);
    }
  } catch (e) {
    console.error(e);
  }
}
run();
