(async () => {
    const isValidRequest = await checkRequestIfValid();
    if (!isValidRequest) {
        window.alert('Not valid request');
        window.alert(`Please login first.`);
        window.location.href = "https://battlecatsarchive.blogspot.com/p/signin-to-bca.html";
    }

    let loading_src = 'https://media.tenor.com/TZxRpEoeslkAAAAM/running.gif';
    let loading_img = document.getElementById('loading_img');

    let country_flag = '';
    let country_name = '';
    let country_code = '';

    await checkUserCountry();
    await initFunctions(['supabase', 'BCA_Users']);

    // Process Form
    const username = document.getElementById('username');
    const gender = document.getElementById('gender');
    const birthday = document.getElementById('birthday');
    const country = document.getElementById('country');
    const form = document.getElementById('form');

    country.innerHTML = `<img src="${country_flag}"/><span>${country_name}</span>`;

    loading_img.src = loading_src;

    let isUserOnline = await BCA_Users.checkIfUserOnline();
    if (isUserOnline) {
        let isUserRegistered = await BCA_Users.checkIfUserCompleteRegistration();
        if (isUserRegistered) {
            // store some info to localstorage
            localStorage.setItem('user', btoa(JSON.stringify({
                email: data.session.user.user_metadata.email,
                profile: user_img
            })));
            window.location.href = `https://battlecatsarchive.blogspot.com/`;
            return;
        } else {
            // show the form to complete registration
            loading_img.src = 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3M0aG5yYTgxeG90cjZmNjdyOWIwcjZzdjRvdWduOWd4NnE5bXl5ayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/r5eafWP6dcbxX8cLeN/giphy.gif';
            form.style.display = 'block';
        }
    }
    else {
        window.localtion.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
    }

    // Functions
    window.submitForm = async () => {
        await finishSetup();
    }

    async function finishSetup() {
        form.style.opacity = "0.7";
        form.style.pointerEvents = "none";
        let isUsernameExist = await checkIfUsernameExists(username.value);
        if (!isUsernameExist) {
            let { data, error } = await supabase.auth.getSession();
            if (error) {
                window.alert(`Error detected: ${error.message}`);
                return;
            }
            if (data.session) {
                data = data.session.user.user_metadata;
                let data_email, data_username, data_gender, data_country, data_birthday, data_prof_img, data_rank;

                data_email = data.email;
                data_prof_img = data.avatar_url == null ? `https://i.imgur.com/wpQrEpL.gif` : `${data.avatar_url}`;
                data_username = username.value;
                data_gender = gender.value;
                data_birthday = birthday.value;
                data_country = country_code;
                data_rank = 1;

                let create = await supabase.from('users').insert({
                    created_at: 'now()',
                    rank_id: data_rank,
                    username: data_username,
                    gender: data_gender,
                    email: data_email,
                    country: data_country,
                    prof_img: data_prof_img,
                    birthday: data_birthday
                });

                if (create.error) {
                    window.alert(`Error has been detected while creating a record in database.
                    Please try again.`);
                    window.location.reload();
                }

                localStorage.setItem('user', btoa(JSON.stringify({
                    email: data_email,
                    profile: data_prof_img
                })));
                window.alert(`Your account has now been created! Welcome aboard: ${data_username}`);
                window.location.href = `https://battlecatsarchive.blogspot.com/`;
            } else {
                window.alert(`Session Expired. Please sign in again.`);
                window.location.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
            }
        } else {
            window.alert("The username is already used. Please try new.");
            form.style.opacity = "1";
            form.style.pointerEvents = "auto";
        }
    }

    async function checkIfUsernameExists(username) {
        let { data, error } = await supabase.from('users').select('username').eq('username', username);

        if (error)
            return;

        if (!data || data.length == 0)
            return;

        return data[0].username;
    }

    async function checkIfUserExists(email) {
        let { data, error } = await supabase.from('users').select('prof_img').eq('email', email);
        if (error || !data || data.length == 0) return;

        return data?.[0].prof_img;
    }

    async function checkRequestIfValid() {
        let url = window.location.href;
        let session = await supabase.auth.getSession();

        return url.includes('.html?redirect=/') && session.data.session;
    }

    async function checkUserCountry() {
        let res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            let country_data = await country_data.json();
            if (!country_data.country_code) {
                country_name = "Anonymous";
                country_code = "Anonymous";
                country_flag = 'https://www.crwflags.com/fotw/images/q/qt%7Danon12.jpg';
            } else {
                country_code = country_data.country_code.toUpperCase();
                country_flag = `https://flagcdn.com/w20/${country_code.toLowerCase()}.png`;
                country_name = country_data.country_name;
            }
        } else {
            country_name = "Anonymous";
            country_code = "Anonymous";
            country_flag = 'https://www.crwflags.com/fotw/images/q/qt%7Danon12.jpg';
        }
    }
})();
