(async() => {
const db = `https://storehaccounts-threads-default-rtdb.firebaseio.com/email_accounts`;

await initFunctions(['FirebaseModule', 'BCA_Url', 'supabase']);

let acc = getHashCodeParam('acc') || BCA_Url.getParamValue('acc');
let isNewMethod = getHashCodeParam('method') || BCA_Url.getParamValue('method');

if (!acc) {
  window.alert("There's no account parameter in this request. No process will continue.");
  return;
}

let data = await FirebaseModule.fetchJSON(`${db}/${ptcDecryptor(atob(acc))}.json`);

if (!data) {
  window.alert("No data has been retrieved from the database, maybe the request was already expired.");
  window.location.href = `https://battlecatsarchive.blogspot.com/`;
  return;
}

const account = document.getElementById('account');
const image_holder = document.getElementById('account-img');
const text_holder = document.getElementById('text_preview')
const alt = document.getElementById('alt_link');

await sleep(1000);

account.innerText = data.accName;
if (isNewMethod) {
  text_holder.innerHTML = `  <p>Transfer Code: <span style="
      font-weight: bold;
      ">${data.img_key}</span></p>
        
      <p>Confirmation Code: <span style="
          font-weight: bold;
      ">${data.img_path}</span></p>`;
  text_holder.style.display = 'flex';
  return;
}

image_holder.src = `https://bca-image-proxy.jasonbourne181997.workers.dev/${data.img_key}/${data.img_path}`;
alt.href = `https://bca-image-proxy.jasonbourne181997.workers.dev/${data.img_key}/${data.img_path}`;

function ptcDecryptor(str) {
  let new_str = atob(str);
  return new_str.split('').reverse().join('').toString();
}

function checkHashCodeParam(param) {
  let hash = window.location.hash.substring(1);

  if (!hash)
    return;

  let hash_parts = hash.split('=');

  return hash_parts.includes(`${param}`) || null;
}

function getHashCodeParam(param) {
  let hash = window.location.hash.substring(1);

  if (!hash)
    return;

  let hash_parts = hash.split('&');

  let value = hash_parts.map(item => {
    let item_parts = item.split(/=(.*)/s).filter(_ => _);
    if (param === item_parts[0])
      return item_parts[1];
  }).filter(_ => _);

  return value ? decodeURIComponent(value) : null;
}
})();
