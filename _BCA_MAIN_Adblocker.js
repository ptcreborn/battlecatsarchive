    (async () => {
        // FIX BUTTON TEMPORARILY
        if (document.querySelector('#postBody')) {
            let downloadLinks = document.querySelectorAll('#postBody a');
            Array.from(downloadLinks).forEach(item => item.classList.contains('main-button') ? item.className = 'button-15' : '');
        }
        // Adblock detected
        new Promise(async (resolve, reject) => {
            let url = new URL(window.location.href);
            if (url.pathname == '/')
                return;

            if (await detectAdBlock() && url.pathname.includes('/p/') && !localStorage.getItem('lem')) {
                document.getElementById('postBody').innerHTML = `<blockquote><h1>Adblocker has been detected by our system. Please read the <a href="https://battlecatsarchive.blogspot.com/p/troubleshooting-adblocker-detected.html">possible solution</a>.</h1></blockquote>`;
            }
            // encryptAllURL
            let blacklist_url = ['https://blogger.googleusercontent.com', 'https://battlecatsarchive.blogspot.com', 'https://battlecats.miraheze.org', 'https://storehaccounts.blogspot.com', 'https://clenchinfer.com', 'https://www.youtube.com', 'https://youtu.be', 'https://youtube.com'];

            let allURLs = document.querySelectorAll('#postBody a');
            const num_ads = 5;

            allURLs.forEach(item => {
                try {
                    let origin = new URL(item).origin;
                    console.log(`Origin: ${origin} ${origin.includes('youtube.com')}`);
                    if (origin != 'null' && !blacklist_url.includes(origin)) {
                        let params = {
                            a: num_ads,
                            t: encodeURIComponent(item.href)
                        }

                        item.href = `https://battlecatsarchive.blogspot.com/p/setup-link-terminal.html?request=${btoa(JSON.stringify(params))}`;
                    }
                    else if (origin.includes('youtube.com') || origin.includes('youtu.be')) {
                        let url = item.href;
                        let videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);

                        if (videoid) {
                            let temp_div = document.createElement('div');

                            if (videoid[1].includes("@") || videoid[1].includes("shorts"))
                                return;

                            temp_div.innerHTML = `<iframe width="100%" height="500" src="https://www.youtube.com/embed/${videoid[1]}" title="BCA YouTube Video Player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

                            item.after(temp_div);
                            item.remove();
                        }
                    }
                } catch (error) {
                    console.log('not a valid url');
                }
            });

        });

        async function detectAdBlock() {
            let adBlockEnabled = false;
            const googleAdUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
            await sleep(500);
            let nodes = document.querySelectorAll('ins.adsbygoogle');
            nodes = Array.from(nodes);
            let filtered_nodes = nodes.filter(item => item.hasAttribute('data-ad-status'));
            try {
                await fetch(new Request(googleAdUrl)).catch(_ => adBlockEnabled = true);
            } catch (e) {
                adBlockEnabled = true;
            } finally {
                return adBlockEnabled;
            }
        }
    })();
