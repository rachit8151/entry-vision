const cron = require("node-cron");
const Student = require("../models/Student");
const Restricted = require("../models/Restricted");

// Runs every midnight
cron.schedule("0 0 * * *", async () => {
  console.log("⏳ Checking expired restrictions...");

  try {
    const today = new Date();

    // Find all restrictions where endDate < today
    const expired = await Restricted.find({
      endDate: { $lt: today },
    });

    for (const item of expired) {
      await Student.updateOne(
        { enrollmentNo: item.enrollmentNo },
        { $set: { isRestrict: false } }
      );

      console.log(`Restriction removed for ${item.enrollmentNo}`);
    }
  } catch (err) {
    console.error("❌ Error in restriction scheduler:", err);
  }
});
