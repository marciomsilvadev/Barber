const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gpssnwvcctyabbkympuu.supabase.co',
  'sb_publishable_XsvLfzGM5zDgQUYdvQgmaQ_boWrw8K3'
);

async function testSecurity() {
  console.log("Teste 1: Tentando ler agendamentos sem estar logado...");
  const { data: appointments, error: apptError } = await supabase.from('appointments').select('*');
  console.log("Resultado (Agendamentos):", appointments ? appointments.length : 0, "registros encontrados.");
  
  console.log("\nTeste 2: Tentando ler perfis de usuários sem estar logado...");
  const { data: profiles, error: profError } = await supabase.from('user_profiles').select('*');
  console.log("Resultado (Perfis):", profiles ? profiles.length : 0, "registros encontrados.");
  
  console.log("\nTeste 3: Tentando inserir um barbeiro sendo um invasor...");
  const { error: insertError } = await supabase.from('barbers').insert([{ name: 'Hacker', price: 0 }]);
  console.log("Resultado da invasão:", insertError ? "BLOQUEADO (" + insertError.message + ")" : "Permitido (Vulnerável!)");
}

testSecurity();
