const dayjs = require("dayjs");

function todayRange() {
  const start = dayjs().startOf("day").toDate();
  const end = dayjs().endOf("day").toDate();
  return { start, end };
}

module.exports = { todayRange };

