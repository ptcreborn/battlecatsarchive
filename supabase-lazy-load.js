await (async() => {

    let script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    document.querySelector('head').appendChild(script);

    const supabaseUrl = 'https://jyqsbxypqjsjwfwpvkhn.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5cXNieHlwcWpzandmd3B2a2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Njg1NzUsImV4cCI6MjA2MzI0NDU3NX0.MAY3ZEdU3V33Iq802b1PtZDqL31xPdoC6xe_ybmnrps';
    // 'supabase' is now available globally because it was deferred

    await initFunctions(['supabase']);

    let supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    window.supabase = supabaseClient;

    // MISC Functions	
    async function initFunctions(dependencies) {
        for (let i = 0; i < dependencies.length; i++)
            await waitFunctionsGetDefined(dependencies[i]);
    }
    async function waitFunctionsGetDefined(funcName) {
        return new Promise(async(resolve) => {
            while (true) {
                try {
                    funcName = eval(funcName);
                    resolve(funcName);
                    break;
                } catch (e) {
                    await sleep(1000);
                }
            }
        });
    }
    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})();
