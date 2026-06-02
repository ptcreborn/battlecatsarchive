(async () => {
    //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/a6788c6826bfd7485fb4d0e94a33cf9ae94b7758/supabase-lazy-load.js');

    // for comment editor function.
    (() => {
        let url = new URL(window.location.href).pathname;

        // appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/2cc05b40e7231e7fe83e8696341ebc53ca271196/bca_pop_messsage.js');
        appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/e2c4d3bb9143d34287aceec5429cc92c4a37ee96/_BCA_CORE.js');

        if (url.includes('/p/') || url.split('/').length != 4) return;

        // Create a javascript script tag and append in the body       
        //appendCSSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/3894f6b465714ff239d331045d0854da53b89779/comment-viewer.css');
        //appendCSSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/5c53bcb5f51dcb54c78f97775e6e7be6b72a3972/comment-editor.css');
        //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/a03b8e3899e27f85d45f91e365bef0b4f068269d/comment-editor-main.js');
        //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/8656857a3d8ccacaf105f09b58349ad642160cc3/comment-editor.js');
        //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/001c860090105cad5cecd6a72fc6de1867454f4f/comment-viewer.js');
        //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/e45a10dfd17b4765e9a34ac226c1da10b149860b/ImgurJS.js');

        appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/a0f3332a6dde044502c414e1b6f8250a38734d1c/bca-comment-main.js');
        appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');
        appendJSFile('https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js');
    })();

    await initFunctions(['Notifications', 'Users']);

    (async () => {
        // for users login and cart
        let default_prof = `https://i.imgur.com/RPBMJIQ.png`;
        let user = document.getElementById('bca_user');
        let user_img = user.querySelector('img');
        let user_email = await Users.checkIfUserOnline();

        if (user_email) {
            try {
                let user_data = JSON.parse(atob(localStorage.getItem('user')));
                user_img.src = user_data.profile;
                user.href = `javascript:void(0)`;
                new Promise(async (resolve, reject) => {
                    // get the count of cart
                    appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');

                    setTimeout(async () => {
                        // CHECK if USER has registered completely.
                        let users_data_temp = await supabase.from('users').select('id').eq('email', user_data.email);

                        if (window.location.href == `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`)
                            return;

                        if (users_data_temp.error || users_data_temp.data?.length == 0) {
                            await supabase.auth.signOut();
                            window.alert("Please kindly finish setting up your account. Login again.");
                            window.location.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
                            return;
                        }

                        // CART
                        await initFunctions(['FirebaseModule', 'supabase']);
                        let data = await FirebaseModule.fetchJSON(`https://storehaccounts-talks-default-rtdb.firebaseio.com/bca_cart/${btoa(user_data.email)}.json`);

                        if (!data) {
                            document.getElementById('bca_cart').addEventListener('click', () => {
                                window.location.href = `https://battlecatsarchive.blogspot.com/p/cart.html?user=${btoa(user_data.email)}`;
                            });
                            return;
                        }

                        let keys = Object.keys(data);
                        document.getElementById('bca_cart').addEventListener('click', () => {
                            window.location.href = `https://battlecatsarchive.blogspot.com/p/cart.html?user=${btoa(user_data.email)}`;
                        });
                        if (keys.length > 0) {
                            document.querySelector('#bca_cart span').style.display = 'block';
                            document.querySelector('#bca_cart span').textContent = keys.length;
                        }
                    }, 100);
                });
            } catch (error) {
                console.log(`error in decoding base64`);
            }
        } else {
            localStorage.removeItem('user');
            user_img.src = default_prof;
        }
    })();

    // For Notifications
    document.getElementById('bca_user').addEventListener('click', async (e) => {
        e.preventDefault();
        document.getElementById('bca-notif-mother').style.display = 'flex';
        await Notifications.initialize();
    });
})();

// RUNS Before DomCONTENTLoads
// This is for adblock detection
(async () => {
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

                        temp_div.innerHTML = `<iframe width="100%" height="300" src="https://www.youtube.com/embed/${videoid[1]}" title="BCA YouTube Video Player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

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
