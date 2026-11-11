import { Link } from "react-router-dom";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { COMPANY } from "@/config/company";

export default function Termos() {
  return (
    <LegalLayout
      title="Termos de Uso"
      description="Condições de uso do site e da plataforma PassoMed."
      path="/termos"
    >
      <p>
        Estes termos regulam o uso do site e da plataforma {COMPANY.brand}, produto do {COMPANY.group}, operados por{" "}
        {COMPANY.legalName}, CNPJ{" "}
        {COMPANY.cnpj}, com sede em {COMPANY.address}. Ao usar o site ou a plataforma, você concorda com eles.
        Instituições contratantes também seguem o contrato de prestação de serviços, que prevalece em caso de
        conflito.
      </p>

      <h2>1. O que é o PassoMed</h2>
      <p>
        O {COMPANY.brand} é uma plataforma de gestão de leitos e de apoio à passagem de plantão: mapa de leitos,
        registro de pendências, programações e planos terapêuticos, movimentações e documentos da unidade.
      </p>

      <h2>2. O que o PassoMed não é</h2>
      <ul>
        <li>
          <strong>Não substitui a passagem de plantão presencial à beira-leito.</strong> É uma ferramenta de apoio ao
          registro e à organização das informações.
        </li>
        <li>
          Não é prontuário eletrônico do paciente nem substitui o prontuário oficial da instituição, que continua
          sendo o registro legal do atendimento.
        </li>
        <li>
          Não realiza diagnóstico nem recomenda condutas. As decisões clínicas são sempre da equipe assistente, sob
          sua responsabilidade profissional.
        </li>
      </ul>

      <h2>3. Contas e acesso</h2>
      <ul>
        <li>O acesso é pessoal e intransferível. Não compartilhe usuário e senha.</li>
        <li>
          A instituição define quem pode acessar cada unidade e setor, e deve remover o acesso de quem deixa a equipe.
        </li>
        <li>Cada usuário responde pelo que registra e deve manter o sigilo das informações de pacientes.</li>
      </ul>

      <h2>4. Uso adequado</h2>
      <p>Não é permitido:</p>
      <ul>
        <li>usar a plataforma para fins diferentes da assistência e da gestão da unidade;</li>
        <li>inserir dados de pacientes sem relação com o atendimento na instituição;</li>
        <li>tentar acessar dados de outra instituição, burlar controles de acesso ou sobrecarregar o serviço;</li>
        <li>copiar, revender ou fazer engenharia reversa da plataforma.</li>
      </ul>

      <h2>5. Planos, preços e ambiente de demonstração</h2>
      <ul>
        <li>
          A contratação é feita por leito, conforme proposta e contrato firmados com a instituição. Os valores
          exibidos no site são referência e podem mudar; vale o que constar na proposta aceita.
        </li>
        <li>
          O ambiente de demonstração usa dados fictícios e é reiniciado periodicamente. Não insira dados reais de
          pacientes nele.
        </li>
      </ul>

      <h2>6. Disponibilidade</h2>
      <p>
        Trabalhamos para manter a plataforma disponível, mas podem ocorrer interrupções por manutenção, falhas de
        fornecedores ou de conexão. A instituição deve manter um procedimento de contingência para a passagem de
        plantão caso o sistema esteja indisponível.
      </p>

      <h2>7. Propriedade intelectual</h2>
      <p>
        A plataforma, o site, as marcas {COMPANY.brand} e Clinical Pass, os textos, as imagens e os vídeos pertencem
        a {COMPANY.legalName}, empresa do {COMPANY.group}. Todos os direitos reservados. Os dados inseridos pela instituição continuam sendo
        dela. Quando a plataforma é usada com a identidade visual de uma instituição, as marcas dessa instituição
        continuam pertencendo a ela.
      </p>

      <h2>8. Responsabilidades</h2>
      <p>
        Respondemos pelo funcionamento da plataforma nos limites do contrato e da lei. Não respondemos por decisões
        clínicas, por informações registradas de forma incorreta ou incompleta pelos usuários, nem por uso em
        desacordo com estes termos.
      </p>

      <h2>9. Privacidade</h2>
      <p>
        O tratamento de dados pessoais segue a <Link to="/privacidade">Política de Privacidade</Link>, em conformidade
        com a LGPD.
      </p>

      <h2>10. Alterações e foro</h2>
      <p>
        Podemos atualizar estes termos; a data no topo indica a versão em vigor. Aplica-se a lei brasileira. Fica
        eleito o foro da comarca de São Luís/MA, salvo disposição diferente em contrato ou em lei.
      </p>

      <h2>11. Contato</h2>
      <p>
        Dúvidas: <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a> ou WhatsApp{" "}
        <a href={COMPANY.supportWhatsappUrl} target="_blank" rel="noopener noreferrer">{COMPANY.supportWhatsapp}</a>.
      </p>
    </LegalLayout>
  );
}
