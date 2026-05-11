// ====================================================
// ฟาร์มโคนม — Google Apps Script Backend
// วางโค้ดนี้ใน Google Apps Script แล้ว Deploy เป็น Web App
// ====================================================

const SHEET_NAME_COWS = "วัว";
const SHEET_NAME_LOGS = "บันทึกนม";

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // สร้าง header
    if (name === SHEET_NAME_COWS) {
      sheet.getRange(1, 1, 1, 6).setValues([["id", "name", "status", "milk", "medicine", "medicineDate"]]);
      // ใส่ข้อมูลเริ่มต้น
      const initial = [
        [1,"วัวหมายเลข 1","active",9.2,"",""],
        [2,"วัวหมายเลข 2","active",8.5,"",""],
        [3,"วัวหมายเลข 3","active",7.8,"",""],
        [4,"วัวหมายเลข 4","active",8.9,"",""],
        [5,"วัวหมายเลข 5","active",7.2,"",""],
        [6,"วัวหมายเลข 6","active",8.1,"",""],
        [7,"วัวหมายเลข 7","active",9.0,"",""],
        [8,"วัวหมายเลข 8","active",7.5,"",""],
        [9,"วัวหมายเลข 9","active",6.8,"",""],
        [10,"วัวหมายเลข 10","medicine",0,"ยาปฏิชีวนะ","2026-05-08"],
        [11,"วัวหมายเลข 11","medicine",0,"ยาแก้อักเสบ","2026-05-09"],
        [12,"วัวหมายเลข 12","medicine",0,"ยาปฏิชีวนะ","2026-05-07"],
        [13,"วัวหมายเลข 13","medicine",0,"ยาบำรุง","2026-05-10"],
      ];
      sheet.getRange(2, 1, initial.length, 6).setValues(initial);
    }
    if (name === SHEET_NAME_LOGS) {
      sheet.getRange(1, 1, 1, 9).setValues([["date","totalMilk","revenue","feedCost","medicineCost","laborCost","molasses","note","recordedBy"]]);
      const initial = [
        ["2026-05-11",73,1460,420,200,300,false,"วัว 4 ตัวหยุดพักนม","เจ้าของ"],
        ["2026-05-10",71,1420,420,250,300,false,"","เจ้าของ"],
        ["2026-05-09",74,1480,400,300,300,false,"","พนักงาน"],
      ];
      sheet.getRange(2, 1, initial.length, 9).setValues(initial);
    }
  }
  return sheet;
}

function doGet(e) {
  const action = e.parameter.action;
  let result;
  try {
    if (action === "getCows") result = getCows();
    else if (action === "getLogs") result = getLogs();
    else result = { error: "Unknown action" };
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  let result;
  try {
    if (action === "saveCows") result = saveCows(data.cows);
    else if (action === "saveLog") result = saveLog(data.log);
    else result = { error: "Unknown action" };
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getCows() {
  const sheet = getSheet(SHEET_NAME_COWS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    obj.milk = parseFloat(obj.milk) || 0;
    obj.id = parseInt(obj.id);
    return obj;
  });
}

function getLogs() {
  const sheet = getSheet(SHEET_NAME_LOGS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    ["totalMilk","revenue","feedCost","medicineCost","laborCost"].forEach(k => obj[k] = parseFloat(obj[k]) || 0);
    obj.molasses = obj.molasses === true || obj.molasses === "TRUE";
    return obj;
  }).reverse();
}

function saveCows(cows) {
  const sheet = getSheet(SHEET_NAME_COWS);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 6).setValues([["id","name","status","milk","medicine","medicineDate"]]);
  if (cows.length > 0) {
    const rows = cows.map(c => [c.id, c.name, c.status, c.milk, c.medicine || "", c.medicineDate || ""]);
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  }
  return { success: true };
}

function saveLog(log) {
  const sheet = getSheet(SHEET_NAME_LOGS);
  sheet.appendRow([log.date, log.totalMilk, log.revenue, log.feedCost, log.medicineCost, log.laborCost, log.molasses, log.note || "", log.recordedBy || ""]);
  return { success: true };
}
