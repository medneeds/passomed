import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/company";

const Contact = () => <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>;

export default function Privacidade() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      description="Como o PassoMed coleta, usa, compartilha e protege dados pessoais, em conformidade com a LGPD."
      path="/privacidade"
    >
      <p>
        Esta política explica como o {COMPANY.brand}, produto do {COMPANY.group} operado por {COMPANY.legalName}, CNPJ{" "}
        {COMPANY.cnpj}, com sede em{" "}
        {COMPANY.address}, trata dados pessoais de quem visita o site, de quem solicita uma demonstração e de quem usa
        a plataforma, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018, "LGPD") e do Marco Civil da
        Internet (Lei 12.965/2014).
      </p>

      <h2>1. Quem é responsável pelos dados</h2>
      <p>Há dois papéis diferentes, e eles mudam o que fazemos com cada tipo de dado:</p>
      <ul>
        <li>
          <strong>Dados de visitantes do site, de quem preenche o cadastro de interesse e das contas de usuário da
          plataforma:</strong> {COMPANY.legalName} é a <em>controladora</em>, ou seja, decide como esses dados são
          tratados.
        </li>
        <li>
          <strong>Dados de pacientes registrados na plataforma</strong> (identificação, idade, diagnósticos,
          pendências, planos terapêuticos e movimentações): a <em>instituição de saúde contratante é a
          controladora</em>, e a {COMPANY.legalName} atua como <em>operadora</em>, tratando esses dados somente para
          executar as funções que a equipe aciona e conforme o contrato. Cabe à instituição ter base legal para
          tratá-los (em regra, a tutela da saúde, art. 11, II, "f", da LGPD) e orientar sua equipe quanto ao sigilo.
        </li>
      </ul>
      <p>
        Encarregado pelo tratamento de dados pessoais (DPO): {COMPANY.dpoName}. Contato: <Contact />.
      </p>

      <h2>2. Quais dados coletamos</h2>
      <h3>Quando você visita o site</h3>
      <ul>
        <li>
          Registros técnicos de acesso mantidos pela hospedagem (endereço IP, data e hora, páginas acessadas e tipo
          de navegador).
        </li>
        <li>Não usamos ferramentas de análise de terceiros nem pixels de anúncios neste site.</li>
      </ul>
      <h3>Quando você solicita uma demonstração</h3>
      <ul>
        <li>
          Nome da instituição, nome e cargo do responsável, e-mail, WhatsApp, cidade e estado, setores de interesse,
          estimativa de leitos, plano de interesse e a mensagem que você escrever.
        </li>
      </ul>
      <h3>Quando você usa a plataforma</h3>
      <ul>
        <li>
          Dados da conta: nome, nome de usuário, categoria e registro profissional quando informados, unidade e
          setores a que tem acesso.
        </li>
        <li>Registros de acesso e de auditoria: quem criou, alterou ou movimentou cada registro, e quando.</li>
        <li>
          Dados de pacientes inseridos pela equipe da instituição, tratados por nós como operadora (veja a seção 1).
        </li>
      </ul>

      <h2>3. Para que usamos e com qual base legal</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Finalidade</th>
            <th scope="col">Base legal (LGPD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Responder à solicitação de demonstração e enviar a proposta</td>
            <td>Procedimentos preliminares a contrato, a pedido do titular (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Criar contas, prestar o serviço contratado e dar suporte</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Processar dados de pacientes nas funções acionadas pela equipe</td>
            <td>Como operadora, segundo as instruções da instituição controladora (art. 39)</td>
          </tr>
          <tr>
            <td>Cobrança, emissão fiscal e guarda de registros exigidos por lei</td>
            <td>Cumprimento de obrigação legal (art. 7º, II)</td>
          </tr>
          <tr>
            <td>Guardar registros de acesso por 6 meses</td>
            <td>Obrigação legal (Marco Civil da Internet, art. 15)</td>
          </tr>
          <tr>
            <td>Segurança, trilha de auditoria e prevenção a fraudes</td>
            <td>Legítimo interesse (art. 7º, IX) e proteção do titular</td>
          </tr>
        </tbody>
      </table>
      <p>
        O {COMPANY.brand} não vende dados pessoais e não usa dados de usuários nem de pacientes para treinar modelos
        de inteligência artificial.
      </p>

      <h2>4. Com quem compartilhamos</h2>
      <p>Compartilhamos dados somente com fornecedores necessários para o serviço funcionar, cada um limitado à sua função:</p>
      <ul>
        <li><strong>Banco de dados e autenticação:</strong> Supabase.</li>
        <li><strong>Hospedagem do site e da aplicação:</strong> Vercel.</li>
        <li>
          <strong>WhatsApp:</strong> apenas quando você escolhe falar conosco por esse canal, sujeito à política da
          Meta.
        </li>
        <li>Autoridades públicas, quando houver obrigação legal ou ordem judicial.</li>
      </ul>
      <p>Cada instituição enxerga somente os dados da própria unidade; o isolamento é aplicado no banco de dados.</p>
      <p>
        O {COMPANY.brand} faz parte do {COMPANY.group}, que reúne {COMPANY.groupProducts.join(", ")}. Os dados
        tratados no {COMPANY.brand} não são compartilhados com os outros produtos do grupo. Se você pedir para
        conhecer outro produto, usaremos seu contato apenas para responder a esse pedido.
      </p>

      <h2>5. Transferência internacional</h2>
      <p>
        Alguns desses fornecedores podem processar dados fora do Brasil. Essas transferências ocorrem para executar o
        contrato e com garantias contratuais de proteção, nos termos do art. 33 da LGPD.
      </p>

      <h2>6. Por quanto tempo guardamos</h2>
      <ul>
        <li>Cadastros de interesse que não viraram contrato: até você pedir a exclusão ou se opor ao contato.</li>
        <li>Dados da conta e conteúdo da plataforma: enquanto durar o contrato com a instituição.</li>
        <li>
          Ao fim do contrato: devolvemos ou eliminamos os dados conforme a instrução da instituição, exceto o que a
          lei obriga a guardar.
        </li>
        <li>Registros de acesso: pelo menos 6 meses, como exige o Marco Civil da Internet.</li>
        <li>Dados fiscais e de cobrança: pelo prazo exigido pela legislação tributária (em regra, 5 anos).</li>
      </ul>

      <h2 id="cookies">7. Cookies e armazenamento no navegador</h2>
      <p>
        Este site não usa cookies de publicidade nem de análise de terceiros. Usamos apenas armazenamento local do
        navegador estritamente necessário:
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Categoria</th>
            <th scope="col">Para que serve</th>
            <th scope="col">Base</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Necessários</td>
            <td>
              Manter você conectado, lembrar a unidade e o setor selecionados, a identidade visual da instituição, o
              tema e o fato de você já ter visto o aviso de cookies
            </td>
            <td>Execução de contrato e legítimo interesse</td>
          </tr>
        </tbody>
      </table>
      <p>
        Por serem necessários ao funcionamento, eles não dependem de consentimento. Você pode apagá-los nas
        configurações do navegador; nesse caso, será preciso entrar de novo. Se passarmos a usar cookies de análise
        ou de marketing, pediremos o seu consentimento antes e atualizaremos esta política.
      </p>

      <h2>8. Segurança</h2>
      <p>
        Adotamos medidas técnicas e administrativas para proteger os dados, como conexão criptografada (HTTPS),
        controle de acesso por conta e por perfil, regras no banco de dados que restringem cada registro à unidade
        a que pertence e trilha de auditoria. Nenhum sistema é totalmente imune a incidentes; se ocorrer um incidente
        que possa trazer risco relevante, comunicaremos os afetados, a instituição controladora e a ANPD, conforme o
        art. 48 da LGPD.
      </p>

      <h2>9. Seus direitos</h2>
      <p>Conforme o art. 18 da LGPD, você pode, a qualquer momento:</p>
      <ul>
        <li>confirmar se tratamos seus dados e acessá-los;</li>
        <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
        <li>pedir a portabilidade dos seus dados;</li>
        <li>saber com quem compartilhamos seus dados;</li>
        <li>opor-se a tratamentos feitos com base no legítimo interesse;</li>
        <li>apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).</li>
      </ul>
      <p>
        Para exercer seus direitos, fale com o encarregado: <Contact />. Respondemos em até 15 dias. Pedidos sobre
        dados de pacientes devem ser feitos à instituição de saúde responsável, que é a controladora; nós a
        apoiaremos no atendimento.
      </p>

      <h2>10. Público</h2>
      <p>
        O {COMPANY.brand} é destinado a instituições de saúde e a seus profissionais, maiores de 18 anos. Não
        coletamos intencionalmente dados de menores como usuários.
      </p>

      <h2>11. Alterações</h2>
      <p>
        Podemos atualizar esta política. Mudanças relevantes serão avisadas no site ou às instituições contratantes,
        e a data no topo indica a versão em vigor. Veja também os <Link to="/termos">Termos de Uso</Link>.
      </p>
    </LegalLayout>
  );
}
