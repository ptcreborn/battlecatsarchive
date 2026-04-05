
// Created on April 5, 2026
// Created in 2 days
// FBDB: https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/checkpoint

(async () => {
    appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/824309794e18edf23fe3d414dfa29e738db0a235/bca-chatbox-widget.js');
    appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');

    await initFunctions(['FirebaseModule']);

    await sleep(5000);

    // check params
    const message = document.getElementById('message');
    const btn = document.getElementById('proceedBtn');

    let param = new URL(window.location.href).searchParams;
    let checkpoint = await FirebaseModule.fetchJSON(
        `https://battlecatsarchive-eb89a-default-rtdb.firebaseio.com/checkpoint/${param.get('id')}.json`
    );

    if (!checkpoint) {
        message.className = 'alert-message warning';
        message.textContent = "Sorry you are missing the checkpoint, please do it from the start. Sorry this happened.";
        return;
    }

    if (!param || param == 'null') {
        message.className = 'alert-message warning';
        message.innerText = "Oops invalid file request. The process will not continue.";
        return;
    }

    // create a checkpoint
    message.innerText = "Decoding the link...";

    await sleep(5000);

    let data = {
        a: 3,
        t: encodeURIComponent(`https://battlecatsarchive.blogspot.com/p/bca-cloud-storage.html?checkpoint=${param.get('id')}&api=${new URL(window.location.href).searchParams.get('decode')}`)
    }

    message.innerText = "You are going to bypass link terminal as everything you did so far is good. Click the button to proceed now.";

    btn.style.display = 'block';
    btn.href = `https://battlecatsarchive.blogspot.com/p/setup-link-terminal.html?request=${btoa(JSON.stringify(data))}`;
})();
