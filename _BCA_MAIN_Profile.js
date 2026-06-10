(async () => {
    await initFunctions(['BCA_Notifications', 'BCA_Users', 'BCA_Cache', 'FirebaseModule', 'supabase']);

    // Get user profile from localstorage and load immediately.
    let default_prof = `https://bca-image-proxy.jasonbourne181997.workers.dev/jPHD0VZY/RPBMJIQ.png`;
    let user = document.getElementById('bca_user');
    let user_img = user.querySelector('img');
    let user_data = BCA_Cache.getItemWithExpiration(BCA_Notifications.LOCALSTORAGE_USER);
    user_img.src = user_data?.prof_img || default_prof;
    user.href = `javascript:void(0)`;

    // Initialize Notif and Profile Icon
    BCA_Notifications.initialize();

    // Load number of notification counts.
    BCA_Notifications.checkNotifCount();

    document.getElementById('bca_user').addEventListener('click', async (e) => {
        e.preventDefault();
        document.getElementById('bca-notif-mother').style.display = 'flex';
    });

    // for users login and cart
    let user_email = await BCA_Users.checkIfUserOnline();

    if (user_email) {
        user_data = user_data || await BCA_Users.getUserInfo('email, prof_img, rank_id(rank_name), username');

        user_data = user_data?.[0] || user_data;

        user_img.src = user_data?.prof_img || default_prof;
        user.href = `javascript:void(0)`;

        // get the count of cart

        let current_url = new URL(window.location.href);

        if (current_url.pathname !== `/p/signin-to-bca.html` && current_url.pathname !== `/p/finish-setting-up.html`) {
            let isUserRegistered = await BCA_Users.checkIfUserCompleteRegistration();
            if (!isUserRegistered) {
                window.alert("Your account has not yet setup. Please kindly login again and finish setting up your account. Thank you.");
                window.location.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
                return;
            }
        }

        // CART
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
    } else {
        localStorage.removeItem('user');
        user_img.src = default_prof;
    }
})();
