

// This will generate links from link terminal.
(async () => {
    const _signature_ = '\x62\x61\x74\x74\x6c\x65\x63\x61\x74\x73\x61\x72\x63\x68\x69\x76\x65';
    const form = document.getElementById('form');
    const input = form.querySelectorAll('input');
    const output = document.getElementById('output');
    await initFunctions(['BCA_Encryptor']);
    let fields = ['t', 'a'];
    let payload = {};
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        Array.from(input).forEach((item, index) => payload[fields[index]] = item.value);
        payload.t = encodeURIComponent(payload.t);
        let param = await BCA_Encryptor.encrypt(JSON.stringify(payload), _signature_);
        output.textContent = `https://battlecatsarchive.blogspot.com/p/bca-link-terminal.html#${encodeURIComponent(param)}`;
        output.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(output.textContent.trim());
                output.style.opacity = '0.5';
                setTimeout(() => {
                    output.style.opacity = '1';
                }, 200);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        })
    });
})();
