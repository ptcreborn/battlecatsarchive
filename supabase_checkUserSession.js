(async () => {
  let {data, error} = await supabase.auth.getSession();
  if(error || !data || !data.session) 
      return;
  return true;
})();
