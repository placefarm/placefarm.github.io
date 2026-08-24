/**********************************************************************
 * 이학정 남동구의원 민원·소통 사이트 백엔드 (Google Apps Script)
 * ------------------------------------------------------------------
 * 역할: 정적 사이트(GitHub Pages)에서 보낸 요청을 받아
 *       Google 스프레드시트에 저장하고, 접수 알림 메일을 보내며,
 *       접수번호+비밀번호로 진행상황을 조회해 준다.
 *
 * 처리하는 action 3가지
 *   - minwon  : 민원 접수      → {ok:true, code:"MW-YYYYMMDD-####"}
 *   - contact : 함께하기/후원문의 → {ok:true}
 *   - status  : 진행상황 조회    → {ok:true, code, type, status, memo, created, updated}
 *
 * ※ 스프레드시트가 곧 관리자 화면입니다. 담당자는 '민원' 시트의
 *   '상태' 칸을 접수→등록→진행중→보완요청→완료 중에서 바꾸면 됩니다.
 **********************************************************************/

// ===== 설정 =====
var NOTIFY_EMAIL = 'yes2plasma@gmail.com';   // 접수 알림 받을 메일
var OFFICE_NAME  = '이학정 남동구의원 사무실';

// 시트 이름
var SHEET_MINWON  = '민원';
var SHEET_CONTACT = '함께하기';

// 민원 상태 단계(진행 조회 화면과 반드시 일치)
var STATUS_STEPS = ['접수','등록','진행중','보완요청','완료'];

// ===== 진입점 =====
function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    var action = p.action || '';

    if (action === 'minwon')  return json(handleMinwon(p));
    if (action === 'contact') return json(handleContact(p));
    if (action === 'status')  return json(handleStatus(p));

    return json({ ok:false, error:'알 수 없는 요청입니다.' });
  } catch (err) {
    return json({ ok:false, error:'서버 오류: ' + err });
  }
}

// GET으로 열었을 때 배포 확인용 (선택)
function doGet() {
  return ContentService
    .createTextOutput('이학정 남동구의원 민원 백엔드가 정상 동작 중입니다.')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ===== 민원 접수 =====
function handleMinwon(p) {
  var name    = trim(p['이름']);
  var pin     = trim(p['비밀번호']);
  var type    = trim(p['유형']);
  var title   = trim(p['제목']);
  var content = trim(p['내용']);
  var region  = trim(p['지역']);
  var phone   = trim(p['연락처']);
  var email   = trim(p['이메일']);

  // 최소 검증(프런트에서도 검증하지만 서버에서도 한 번 더)
  if (!name || !type || !title || !content) {
    return { ok:false, error:'필수 항목이 비어 있습니다.' };
  }
  if (!/^[0-9]{4}$/.test(pin)) {
    return { ok:false, error:'조회 비밀번호는 숫자 4자리여야 합니다.' };
  }
  if (!phone && !email) {
    return { ok:false, error:'연락처 또는 이메일 중 하나는 필요합니다.' };
  }

  var sheet = getSheet(SHEET_MINWON, [
    '접수번호','상태','접수일시','최근업데이트','유형','제목','내용',
    '지역','이름','연락처','이메일','비밀번호','담당자안내','동의'
  ]);

  var now  = new Date();
  var code = makeCode(sheet);

  sheet.appendRow([
    code, '접수', fmt(now), fmt(now), type, title, content,
    region, name, phone, email, pin, '', '동의'
  ]);

  // 사무실 알림 메일 (개인정보는 시트에만 저장, 메일에는 요약만)
  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: '[민원접수] ' + code + ' · ' + type + ' · ' + title,
      body:
        '새 민원이 접수되었습니다.\n\n' +
        '접수번호: ' + code + '\n' +
        '유형: ' + type + '\n' +
        '제목: ' + title + '\n' +
        '지역: ' + (region || '-') + '\n' +
        '접수일시: ' + fmt(now) + '\n' +
        '----------------------------------------\n' +
        '내용:\n' + content + '\n' +
        '----------------------------------------\n' +
        '연락처: ' + (phone || '-') + '\n' +
        '이메일: ' + (email || '-') + '\n\n' +
        '※ 스프레드시트 "민원" 시트에서 상태를 관리하세요.\n' +
        '  (접수 → 등록 → 진행중 → 보완요청 → 완료)'
    });
  } catch (mailErr) {
    // 메일 실패해도 접수는 성공 처리
  }

  return { ok:true, code:code };
}

// ===== 함께하기 / 후원 문의 =====
function handleContact(p) {
  var type  = trim(p['구분']);
  var name  = trim(p['이름']);
  var phone = trim(p['연락처']);
  var email = trim(p['이메일']);
  var memo  = trim(p['메모']);

  if (!name || !phone) {
    return { ok:false, error:'성함과 연락처는 필수입니다.' };
  }

  var sheet = getSheet(SHEET_CONTACT, [
    '접수일시','구분','이름','연락처','이메일','메모','처리상태','동의'
  ]);

  var now = new Date();
  sheet.appendRow([ fmt(now), type, name, phone, email, memo, '미연락', '동의' ]);

  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: '[함께하기] ' + (type || '문의') + ' · ' + name,
      body:
        '새 문의가 접수되었습니다.\n\n' +
        '구분: ' + (type || '-') + '\n' +
        '이름: ' + name + '\n' +
        '연락처: ' + phone + '\n' +
        '이메일: ' + (email || '-') + '\n' +
        '메모: ' + (memo || '-') + '\n' +
        '일시: ' + fmt(now) + '\n\n' +
        '※ "함께하기" 시트에서 연락 여부를 관리하세요.'
    });
  } catch (mailErr) {}

  return { ok:true };
}

// ===== 진행상황 조회 (접수번호 + 비밀번호) =====
function handleStatus(p) {
  var code = trim(p['code']).toUpperCase();
  var pin  = trim(p['pin']);

  if (!code || !pin) {
    return { ok:false, error:'접수번호와 비밀번호를 입력해주세요.' };
  }

  var sheet = getSheet(SHEET_MINWON, null);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { ok:false, error:'일치하는 민원을 찾을 수 없습니다.' };
  }

  var header = values[0];
  var col = indexMap(header);

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowCode = String(row[col['접수번호']] || '').toUpperCase();
    var rowPin  = String(row[col['비밀번호']] || '');
    if (rowCode === code && rowPin === pin) {
      var status = String(row[col['상태']] || '접수');
      if (STATUS_STEPS.indexOf(status) === -1) status = '접수';
      return {
        ok: true,
        code: rowCode,
        type: String(row[col['유형']] || ''),
        status: status,
        memo: String(row[col['담당자안내']] || ''),
        created: String(row[col['접수일시']] || ''),
        updated: String(row[col['최근업데이트']] || '')
      };
    }
  }
  return { ok:false, error:'일치하는 민원을 찾을 수 없습니다. 접수번호와 비밀번호를 확인해주세요.' };
}

// ===== 담당자가 상태를 바꾸면 '최근업데이트' 자동 기록 =====
// (스프레드시트 > 확장 프로그램 > Apps Script 에서 이 함수의
//  트리거를 'onEdit'으로 걸어두면 됩니다. 설정가이드 참고.)
function onEditUpdate(e) {
  try {
    var sh = e.range.getSheet();
    if (sh.getName() !== SHEET_MINWON) return;
    var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var col = indexMap(header);
    var editedCol = e.range.getColumn();
    // '상태' 칸을 수정했을 때만
    if (editedCol === (col['상태'] + 1)) {
      var r = e.range.getRow();
      if (r > 1) {
        sh.getRange(r, col['최근업데이트'] + 1).setValue(fmt(new Date()));
      }
    }
  } catch (err) {}
}

// ===== 유틸 =====
function getSheet(name, headerIfNew) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headerIfNew) {
      sh.appendRow(headerIfNew);
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

function makeCode(sheet) {
  var d = new Date();
  var ymd = Utilities.formatDate(d, 'Asia/Seoul', 'yyyyMMdd');
  // 같은 날짜의 마지막 일련번호 + 1
  var last = 0;
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    var c = String(values[i][0] || '');
    var m = c.match(/^MW-(\d{8})-(\d{4})$/);
    if (m && m[1] === ymd) {
      var n = parseInt(m[2], 10);
      if (n > last) last = n;
    }
  }
  var seq = ('000' + (last + 1)).slice(-4);
  return 'MW-' + ymd + '-' + seq;
}

function indexMap(header) {
  var m = {};
  for (var i = 0; i < header.length; i++) m[String(header[i]).trim()] = i;
  return m;
}

function fmt(d) {
  return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
}

function trim(v) { return (v == null ? '' : String(v)).trim(); }

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
