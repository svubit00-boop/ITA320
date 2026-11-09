// جميع التوابع اللازمة للموقع في ملف واحد

// قراءة اسم وسعر السيارة من صف الجدول نفسه (لا حاجة لقائمة منفصلة)
function getCarInfo(code) {
  var row = $('.pick-car[value="' + code + '"]').closest("tr");
  var cells = row.find("td");
  return {
    name: $.trim(cells.eq(2).text()),
    price: parseInt(cells.eq(4).text().replace(/\D/g, ""), 10)
  };
}

// إظهار / إخفاء تفاصيل سيارة (jQuery)
function toggleDetails(code, show) {
  var row = $("#details-" + code);
  if (show) { row.fadeIn(250); } else { row.fadeOut(250); }
}

// جلب رموز السيارات المختارة
function getSelectedCars() {
  var list = [];
  $(".pick-car:checked").each(function () { list.push($(this).val()); });
  return list;
}

// الضغط على زر متابعة
function onContinue() {
  var selected = getSelectedCars();
  if (selected.length === 0) {
    $("#select-error").text("يرجى اختيار سيارة واحدة على الأقل.");
    return;
  }
  $("#select-error").text("");
  var names = [];
  for (var i = 0; i < selected.length; i++) {
    names.push(getCarInfo(selected[i]).name);
  }
  $("#selected-list").text(names.join("، "));
  $("#result-box").hide();
  $("#booking-section").slideDown(400, function () {
    $("html, body").animate({ scrollTop: $("#booking-section").offset().top - 20 }, 400);
  });
}

// التحقق من صيغة yyyy-mm-dd ومن أن التاريخ حقيقي
function parseDate(str) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (m === null) { return null; }
  var y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
  var dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) { return null; }
  return dt;
}

function validateName(v) { return /^[\u0621-\u064A]+( [\u0621-\u064A]+)+$/.test(v); }

function validateNid(v) {
  if (!/^\d{11}$/.test(v)) { return false; }
  var gov = parseInt(v.substring(0, 2), 10);
  return gov >= 1 && gov <= 14;
}

// Syriatel: 093 098 099 ، MTN: 094 095 096
function validateMobile(v) { return /^09(3|4|5|6|8|9)\d{7}$/.test(v); }

function validateEmail(v) { return /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(v); }

function setError(id, msg) { $("#err-" + id).text(msg); return msg === ""; }

// التحقق من النموذج ثم عرض النتيجة
function onSubmitForm() {
  var ok = true;
  var name = $.trim($("#fullname").val());
  var nid = $.trim($("#nid").val());
  var mobile = $.trim($("#mobile").val());
  var email = $.trim($("#email").val());
  var startStr = $.trim($("#start").val());
  var endStr = $.trim($("#end").val());

  ok = setError("fullname", validateName(name) ? "" : "الاسم يجب أن يكون بأحرف عربية فقط (اسمان على الأقل)") && ok;
  ok = setError("nid", validateNid(nid) ? "" : "الرقم الوطني 11 خانة وأول خانتين بين 01 و14") && ok;
  ok = setError("mobile", validateMobile(mobile) ? "" : "رقم غير مطابق لشبكتي Syriatel أو MTN") && ok;
  ok = setError("email", validateEmail(email) ? "" : "البريد الإلكتروني غير صحيح") && ok;

  var start = parseDate(startStr);
  var end = parseDate(endStr);
  ok = setError("start", start !== null ? "" : "تاريخ غير صحيح، الصيغة yyyy-mm-dd") && ok;
  if (end === null) {
    ok = setError("end", "تاريخ غير صحيح، الصيغة yyyy-mm-dd") && ok;
  } else if (start !== null && end <= start) {
    ok = setError("end", "يجب أن يكون تاريخ النهاية لاحقاً لتاريخ البداية") && ok;
  } else {
    setError("end", "");
  }
  if (!ok) { return false; }

  showResult(start, end);
  return false;
}

// حساب وعرض النتيجة
function showResult(start, end) {
  var days = Math.round((end - start) / 86400000);
  var selected = getSelectedCars();
  var total = 0;
  var html = "<h3>نتيجة الحجز</h3><p>عدد أيام التأجير: <strong>" + days + "</strong></p><ul>";
  for (var i = 0; i < selected.length; i++) {
    var car = getCarInfo(selected[i]);
    var sub = car.price * days;
    total += sub;
    html += "<li>" + car.name + ": " + car.price + " × " + days + " = " + sub + " ل.س</li>";
  }
  html += "</ul><p>المجموع: <strong>" + total + " ل.س</strong></p>";
  var discount = 0;
  if (days > 10) {
    discount = total * 0.05;
    html += "<p>خصم 5% (المدة أكبر من 10 أيام): <strong>" + discount + " ل.س</strong></p>";
  } else {
    html += "<p>لا يوجد خصم (الخصم للمدة الأكبر من 10 أيام).</p>";
  }
  html += "<p>المبلغ النهائي: <strong>" + (total - discount) + " ل.س</strong></p>";
  $("#result-box").html(html).slideDown(400);
}

// ربط الأحداث
$(document).ready(function () {
  $(".show-details").on("change", function () { toggleDetails($(this).val(), this.checked); });
  $("#continue-btn").on("click", onContinue);
  $("#booking-form").on("submit", function (e) { e.preventDefault(); return onSubmitForm(); });
  $("#booking-form").on("reset", function () { $(".error").text(""); $("#result-box").hide(); });
});