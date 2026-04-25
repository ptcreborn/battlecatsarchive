// April 26, 2026

(async () => {
    // Immediate Runnable Function
    new Promise(async (resolve, reject) => {
        let url = new URL(window.location.href);
        if (url.pathname == '/')
            return;

        if (await detectAdBlock() && url.pathname.includes('/p/') && !localStorage.getItem('lem')) {
            document.getElementById('postBody').innerHTML = `<blockquote><h1>Adblocker has been detected by our system. Please read the <a href="https://battlecatsarchive.blogspot.com/p/troubleshooting-adblocker-detected.html">possible solution</a>.</h1></blockquote>`;
        }

        // encryptAllURL
        let blacklist_url = ['https://blogger.googleusercontent.com', 'https://battlecatsarchive.blogspot.com', 'https://battlecats.miraheze.org', 'https://storehaccounts.blogspot.com'];

        let allURLs = document.querySelectorAll('#postBody a');
        const num_ads = 5;

        allURLs.forEach(item => {
            try {
                let origin = new URL(item).origin;
                if (origin != 'null' && !blacklist_url.includes(origin)) {
                    let params = {
                        a: num_ads,
                        t: encodeURIComponent(item.href)
                    }

                    item.href = `https://battlecatsarchive.blogspot.com/p/setup-link-terminal.html?request=${btoa(JSON.stringify(params))}`;
                }
            } catch (error) {
                console.log('not a valid url');
            }
        })
    });

    async function detectAdBlock() {
        let adBlockEnabled = false
        const googleAdUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
        try {
            await fetch(new Request(googleAdUrl)).catch(_ => adBlockEnabled = true);
        } catch (e) {
            adBlockEnabled = true;
        } finally {
            return adBlockEnabled;
        }
    }

    const initDOMTasks = async () => {
        // Optional: Add a slight delay to let the UI settle
        setTimeout(() => {
            const script = document.createElement('script');
            script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6102173297126028";
            script.async = true;
            script.crossOrigin = "anonymous"; // Good practice for third-party scripts
            document.head.appendChild(script);
        }, 100);
    };

    const initLoadTasks = () => {
        //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/a6788c6826bfd7485fb4d0e94a33cf9ae94b7758/supabase-lazy-load.js');

        (() => {
            // for users login and cart
            let default_prof = `https://i.imgur.com/RPBMJIQ.png`;
            let user = document.getElementById('bca_user');
            let user_img = user.querySelector('img');

            if (localStorage.getItem('user')) {
                try {
                    let user_data = JSON.parse(atob(localStorage.getItem('user')));
                    user_img.src = user_data.profile;
                    user.href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${user_data.email}`;
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
                user_img.src = default_prof;
                user.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
            }
        })();

        // for comment editor function.
        (() => {
            let url = new URL(window.location.href).pathname;
            if (url.includes('/p/') || url.split('/').length != 4) return;

            // Create a javascript script tag and append in the body       
            //appendCSSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/3894f6b465714ff239d331045d0854da53b89779/comment-viewer.css');
            //appendCSSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/5c53bcb5f51dcb54c78f97775e6e7be6b72a3972/comment-editor.css');
            //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/a03b8e3899e27f85d45f91e365bef0b4f068269d/comment-editor-main.js');
            //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/8656857a3d8ccacaf105f09b58349ad642160cc3/comment-editor.js');
            //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/001c860090105cad5cecd6a72fc6de1867454f4f/comment-viewer.js');
            //appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/e45a10dfd17b4765e9a34ac226c1da10b149860b/ImgurJS.js');

            appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/a17b3cb40418ae6a6dca1485bf176745c3184f10/bca_pop_messsage.js');
            appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/f5cee9200635464055002eb368b900f492bf5971/bca-comment-main.js');
            appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');
            appendJSFile('https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js');
        })();
    };

    if (document.readyState === "interactive" || document.readyState === "complete") {
        initDOMTasks();
    } else {
        document.addEventListener("DOMContentLoaded", initDOMTasks);
    }

    if (document.readyState === "complete") {
        initLoadTasks();
    } else {
        window.addEventListener("load", initLoadTasks);
    }
})();


// RUNS Before DomCONTENTLoads
// This is for adblock detection


// CALLABLE FUNCTIONS
async function initFunctions(dependencies) {
    for (let i = 0; i < dependencies.length; i++)
        await waitFunctionsGetDefined(dependencies[i]);

    async function waitFunctionsGetDefined(funcName) {
        return new Promise(async (resolve) => {
            let tries = 0;
            let showsWarning = false;
            while (true) {
                if (tries >= 10) {
                    window.alert(`Getting function ${funcName} has too many attempts already.`);
                    tries = 0;
                    showsWarning = true;
                }
                try {
                    let tempName = funcName;
                    funcName = eval(funcName);
                    resolve(funcName);
                    if (showsWarning)
                        window.alert(`Item ${tempName} has loaded properly.`);
                    break;
                } catch (e) {
                    tries++;
                    await sleep(1000);
                }
            }
        });
    }
}
