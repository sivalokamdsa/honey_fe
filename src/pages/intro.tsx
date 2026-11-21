import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import SiteNav, { type SectionLink } from "../components/SiteNav";
import "./intro.css";

const menusections: SectionLink[] = [
  { id: "toc", label: "విషయ సూచిక" },
  ...Array.from({ length: 16 }, (_, i) => ({
    id: `page${i + 1}`,
    label: `పేజీ ${i + 1}`,
  })),
];

// Which route renders each book page. BeeKeeping has pages 1–25 and 27–40;
// BeeKeeping2 has pages 47–51. Anything else has no page in the app.
function pageRoute(n: number): string | null {
  if (n >= 1 && n <= 40 && n !== 26) return "/beekeeping";
  if (n >= 47 && n <= 51) return "/beekeeping2";
  return null;
}

/** Links to the book page, or renders plain text when no route has it. */
function PageLink({ page, children }: { page: string; children: ReactNode }) {
  const n = Number(page);
  const to = pageRoute(n);
  return to ? <Link to={`${to}?page=${n}`}>{children}</Link> : <>{children}</>;
}

type Row = { no: string; te: string; en: string; page: string };

const tocRows: Row[] = [
  { no: "1", te: "తేనీటీగల పెంపకం - పరిచయం", en: "Introduction", page: "1" },
  { no: "2", te: "తేనీటీగల రకములు", en: "Types of honey bees", page: "5" },
  {
    no: "3",
    te: "తేనె పరిశ్రమ - అవగాహన",
    en: "Honey industry - awareness",
    page: "9",
  },
  {
    no: "4",
    te: "తేనీటీగల పెంపకం ప్రారంభం",
    en: "Starting beekeeping",
    page: "15",
  },
  {
    no: "5",
    te: "తేనె పరిశ్రమ నిత్య నిర్వహణా చర్యలు",
    en: "Daily management practices",
    page: "22",
  },
  {
    no: "6",
    te: "తేనె పట్టు - దాని ఉత్పత్తులు",
    en: "Colony and its products",
    page: "27",
  },
  {
    no: "7",
    te: "తేనె పెట్టె - ఇతర పరికరములు",
    en: "Hive and other equipment",
    page: "37",
  },
  {
    no: "8",
    te: "తేనీటీగల వ్యాధులు - శత్రువులు",
    en: "Diseases and enemies",
    page: "39",
  },
  {
    no: "9",
    te: "తేనీటీగలు - క్రిమి సంహారక మందుల విష ప్రభావం",
    en: "Effect of pesticides",
    page: "43",
  },
  {
    no: "10",
    te: "మేలుజాతి తేనీటీగల ఉత్పత్తి",
    en: "Rearing good-quality bees",
    page: "48",
  },
  {
    no: "11",
    te: "తేనీటీగల పెంపకంలో ముఖ్యమైన శత్రువుల యాజమాన్యం",
    en: "Management of major enemies",
    page: "53",
  },
  {
    no: "12",
    te: "తేనీటీగల పెంపకం - ఋతువులకు అనుకూలంగా యాజమాన్యం",
    en: "Seasonal management",
    page: "61",
  },
  {
    no: "13",
    te: "తేనె ఉపయోగాలు, పోషక విలువలు",
    en: "Uses and nutritional value of honey",
    page: "75",
  },
  { no: "-", te: "ముగింపు", en: "Conclusion", page: "87" },
  { no: "-", te: "ప్రశ్నావళి", en: "Questionnaire", page: "87" },
];

type Table = { headers: string[]; rows: string[][] };

function DataTable({ headers, rows }: Table) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHead({
  te,
  en,
  page,
}: {
  te: string;
  en?: string;
  page: number;
}) {
  return (
    <h2>
      {te}
      {en && <span className="en"> ({en})</span>}
      <span className="page-no">p. {page}</span>
    </h2>
  );
}
const displayExtra = false;

export default function Intro() {
  return (
    <>
      <SiteNav menusections={menusections} />

      <header className="hero">
        <div className="hero-inner">
          <h1>తేనీటీగల పెంపకం</h1>
          <p className="en">Beekeeping Manual</p>
        </div>
      </header>

      <main className="intro">
        <section id="toc" className="card">
          <h2>
            విషయ సూచిక <span className="en">(Table of Contents)</span>
          </h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>సంఖ్య</th>
                  <th>విషయం</th>
                  <th>పే.నెం.</th>
                </tr>
              </thead>
              <tbody>
                {tocRows.map((r) => (
                  <tr key={r.te}>
                    <td>{r.no}</td>
                    <td>
                      <PageLink page={r.page}>
                        {r.te} <span className="en">({r.en})</span>
                      </PageLink>
                    </td>
                    <td>
                      <PageLink page={r.page}>{r.page}</PageLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {displayExtra && (
          <>
            <section id="page1" className="card">
              <SectionHead
                te="తేనీటీగ బాహ్య నిర్మాణము"
                en="External structure of the honey bee"
                page={1}
              />
              <h3>
                Figure 3.1 - General morphology of a worker honey bee (కూలి ఈగ
                బాహ్య నిర్మాణము)
              </h3>
              <DataTable
                headers={["తెలుగు", "English"]}
                rows={[
                  ["తల", "Head"],
                  ["రొమ్ము భాగము", "Thorax"],
                  ["రెక్కలు", "Wings"],
                  ["రెక్క బిందు", "Wing hinge / Propodeum"],
                  ["ఉదరభాగం", "Abdomen"],
                  ["కాళ్ళు", "Legs"],
                  ["సంయుక్త కళ్ళు", "Compound eye"],
                  ["స్పర్శ శృంగాలు", "Antennae"],
                  ["క్రింది దవడ (చానువు)", "Mandible"],
                ]}
              />
              <h3>
                Figure 3.2 - Mandibles of different castes of honey bees (వివిధ
                రకములలో తేనీగ దంతములు)
              </h3>
              <ul>
                <li>మగ ఈగ దంతము - Mandible of drone</li>
                <li>రాణి ఈగ దంతము - Mandible of queen</li>
                <li>కూలి ఈగ దంతము - Mandible of worker</li>
              </ul>
              <h3>
                Figure 3.3 - Mouth parts of a worker honey bee (తేనీటీగ - నోటి
                భాగములు)
              </h3>
              <p className="en">
                Proboscis fossa, Cardo, Lorum, Postmentum, Prementum, Mandible,
                Stipes, Lacinia, Maxillary palpus, Paraglossa, Galea, Labial
                palpus, Glossa (tongue), Flabellum.
              </p>
            </section>

            <section id="page2" className="card">
              <SectionHead
                te="తేనీటీగల జాతులు"
                en="Species of honey bees"
                page={2}
              />
              <DataTable
                headers={["శాస్త్రీయ నామం", "Description"]}
                rows={[
                  [
                    "Apis dorsata (ఏపిస్ దోర్సాటా)",
                    "Giant honey bee; builds a single, exposed comb hanging from a branch (పట్టు పట్టు విధానము).",
                  ],
                  [
                    "Apis cerana (ఏపిస్ సెరానా)",
                    "Asian honey bee; builds multiple parallel combs inside cavities (పట్టు పట్టు విధానము).",
                  ],
                  [
                    "Apis florea (ఏపిస్ ఫ్లోరియా)",
                    "Dwarf honey bee; builds a small single comb in the open (పట్టు పట్టు విధానము).",
                  ],
                  [
                    "Apis mellifera (ఐరోపా తేనీగ)",
                    "European honey bee; the most widely managed species for commercial beekeeping.",
                  ],
                ]}
              />
            </section>

            <section id="page3" className="card">
              <SectionHead
                te="తేనీటీగల రకాలు"
                en="Castes of honey bees"
                page={3}
              />
              <DataTable
                headers={["తెలుగు", "English", "Role"]}
                rows={[
                  ["రాణి ఈగ", "Queen", "Egg-layer of the colony"],
                  ["మగ ఈగ", "Drone", "Male bee (from unfertilized egg)"],
                  ["కూలి ఈగ", "Worker", "Female, does all colony work"],
                ]}
              />
              <h3>Development of castes (కులాల అభివృద్ధి)</h3>
              <ul>
                <li>Egg laid by queen (రాణి ఈగ పెట్టిన గుడ్డు)</li>
                <li>
                  Fertilized egg → female (ఫలదీకరణం చెందిన ఆడ):
                  <ul>
                    <li>
                      Light feeding (తక్కువ ఆహారం తీసుకొంటుంది) → Worker (కూలి
                      ఈగ)
                    </li>
                    <li>
                      Heavy feeding + Royal jelly (రాజాహారం) → Queen (రాణి ఈగ)
                    </li>
                  </ul>
                </li>
                <li>
                  Unfertilized egg → male (ఫలదీకరణం చెందని మగ) → Drone (మగ ఈగ)
                </li>
              </ul>
            </section>

            <section id="page4" className="card">
              <SectionHead
                te="తేనీటీగల జీవిత చక్రం"
                en="Life cycle of the honey bee"
                page={4}
              />
              <h3>Comb types and brood patterns</h3>
              <DataTable
                headers={["Label", "తెలుగు", "Meaning"]}
                rows={[
                  ["WB", "కూలి ఈగ సంతానంతో తేనెపట్టు", "Worker brood comb"],
                  ["DB", "మగ ఈగ సంతానంతో తేనె పట్టు", "Drone brood comb"],
                  ["SH", "సీలు వేయబడిన తేనె గదులు", "Sealed honey cells"],
                  ["UH", "సీలు వేయబడని తేనె గదులు", "Unsealed honey cells"],
                  ["P", "పుప్పొడి", "Pollen"],
                ]}
              />
              <h3>Stages of development</h3>
              <ol>
                <li>
                  రాణి ఈగ పట్టు గదులలో గుడ్డు పెట్టుట - Queen lays egg in brood
                  cell
                </li>
                <li>
                  పురుగులకు ఆహారం అందిస్తున్న కూలి ఈగ - Worker feeds hatched
                  larva
                </li>
                <li>పెరిగిన పురుగులు - Larva reaches full growth</li>
                <li>కూలి ఈగ గదులను మూసివేయుట - Worker caps the cell</li>
                <li>కోశస్థ దశ - Larva spins cocoon and becomes pupa</li>
                <li>బయటకు వచ్చిన తేనీగ - Adult bee leaves the cell</li>
              </ol>
              <p className="en">
                Stages: Egg (గ్రుడ్డు) → Larva (లార్వా) → Pupa (కోశస్థ దశ) →
                Adult (పోతు ఈగ)
              </p>
            </section>

            <section id="page5" className="card">
              <SectionHead
                te="తేనీటీగల పెంపకానికి అనుకూలమైన మొక్కల జాతులు"
                en="Suitable forage plants"
                page={5}
              />
              <DataTable
                headers={["మొక్క / పంట", "Season / Notes"]}
                rows={[
                  [
                    "పైక్లాంతస్ కలుపు మొక్క (Plectranthus weed)",
                    "High nectar yield",
                  ],
                  [
                    "టూనా సీలియేటా (Toona ciliata)",
                    "Summer - nectar-yielding flowers",
                  ],
                  [
                    "తుమ్మజాతి పుష్పములు (Acacia-type flowers)",
                    "Rainy season - abundant nectar",
                  ],
                  ["ఆవాలు (Mustard)", "Winter - honey from mustard"],
                  ["ప్రొద్దుతిరుగుడు (Sunflower)", "Honey from sunflower crop"],
                  ["యూకలిప్టస్ (Eucalyptus)", "Summer - honey available"],
                ]}
              />
            </section>

            <section id="page6" className="card">
              <SectionHead
                te="తేనే పట్టుల యాజమాన్యం"
                en="Apiary management"
                page={6}
              />
              <ul>
                <li>తేనే పట్టులో ఉన్న పెట్టెలు - Hive boxes in an apiary</li>
                <li>తేనే పట్టును పరిశీలించుట - Inspecting the colony</li>
                <li>ఐరోపా తేనీగలు - European honey bees</li>
                <li>పట్టు తేనీగలు - Bees on the comb</li>
              </ul>
            </section>

            <section id="page7" className="card">
              <SectionHead
                te="రాణి ఈగ యాజమాన్యం"
                en="Queen management"
                page={7}
              />
              <h3>Types of queens</h3>
              <ul>
                <li>మేలుజాతి రాణి ఈగలు - Good-quality queens</li>
                <li>ముసలి రాణి ఈగలు - Old queens</li>
                <li>జతకట్టని రాణి ఈగలు - Unmated queens</li>
              </ul>
              <h3>Brood patterns indicating queen performance</h3>
              <DataTable
                headers={["Figure", "తెలుగు", "Meaning"]}
                rows={[
                  [
                    "12.8 - Eggs laid by a good queen",
                    "గదిలో ఒక గుడ్డు",
                    "Single egg per cell - healthy queen",
                  ],
                  [
                    "12.9 - Failing queen, patchy brood",
                    "నియంత్రణ లేకుండా గుడ్లు పెట్టటం",
                    "Uncontrolled egg laying - failing queen",
                  ],
                  [
                    "12.10 - Multiple eggs by laying workers",
                    "గదిలో ఒకటి కన్నా ఎక్కువ గుడ్లు",
                    "More than one egg per cell - laying workers",
                  ],
                ]}
              />
            </section>

            <section id="page8" className="card">
              <SectionHead
                te="తేనీటీగల పెంపకం - పరికరాలు"
                en="Equipment"
                page={8}
              />
              <h3>Parts of a hive</h3>
              <DataTable
                headers={["తెలుగు", "English"]}
                rows={[
                  ["పై మూత", "Top cover"],
                  ["లోపలి మూత", "Inner cover"],
                  ["తేనె స్పేస్ / తేనె బోర్డు", "Honey board"],
                  ["సూపర్ ఛాంబర్", "Super chamber"],
                  ["బ్రూడ్ ఛాంబర్", "Brood chamber"],
                  ["క్రింద బోర్డు", "Bottom board"],
                  ["పట్టు స్టాండ్", "Hive stand"],
                ]}
              />
              <h3>Types of hives</h3>
              <ul>
                <li>తేనె పెట్టెలు - Standard hive boxes</li>
                <li>న్యూక్లియస్ తేనె పెట్టె - Nucleus hive</li>
                <li>ఎగ్విబిషన్ తేనెపెట్టె - Exhibition hive</li>
              </ul>
            </section>

            <section id="page9" className="card">
              <SectionHead
                te="తేనీటీగల పెంపకం - పరికరాలు"
                en="Equipment, continued"
                page={9}
              />
              <ul>
                <li>
                  కృతి మైనపు అట్టలు - Artificial comb foundation sheets (used
                  with a roller press)
                </li>
                <li>ముసుగు - Bee veil</li>
                <li>
                  ఇతర పరికరాలు - Other tools (labelled a to f: hive tool, knife,
                  brush, and others)
                </li>
                <li>ఫీడర్ - Feeder</li>
                <li>తేనే పట్టు వల - Bee colony net / protective cover</li>
              </ul>
            </section>

            <section id="page10" className="card">
              <SectionHead
                te="తేనీటీగల పెంపకం - పరికరాలు"
                en="Equipment, continued"
                page={10}
              />
              <DataTable
                headers={["తెలుగు", "English"]}
                rows={[
                  ["రాణి ఈగ నిర్బంధన ద్వారము", "Queen excluder"],
                  ["తేనె తీయు యంత్రం", "Honey extractor"],
                  ["పుప్పొడిని సేకరించు బోను", "Pollen trap"],
                  ["మైనమును కరిగించు పరికరము", "Wax melter"],
                  ["తేనీగలు తొలగింపు పరికరము", "Bee escape"],
                ]}
              />
            </section>

            <section id="page11" className="card">
              <SectionHead
                te="తేనీటీగల పెంపకం - పరికరాలు"
                en="Equipment, continued"
                page={11}
              />
              <DataTable
                headers={["తెలుగు", "English"]}
                rows={[
                  ["రాణి ఈగ వంజరం", "Queen cage"],
                  ["రాణి ఈగ నిర్బంధక ద్వారము", "Queen excluder"],
                  ["రాణి ఈగ నిరోధకము", "Queen isolation box"],
                  ["పొగ బబ్బా", "Smoker"],
                  ["హైవ్ టూల్", "Hive tool"],
                  ["చాకు", "Knife (uncapping knife)"],
                ]}
              />
            </section>

            <section id="page12" className="card">
              <SectionHead
                te="తేనీటీగల వ్యాధులు"
                en="Honey bee diseases - symptoms"
                page={12}
              />
              <DataTable
                headers={["వ్యాధి", "Host species"]}
                rows={[
                  [
                    "సాక్ బ్రూడ్ వ్యాధి లక్షణాలు (Sacbrood symptoms)",
                    "Apis mellifera",
                  ],
                  [
                    "యూరోపియన్ పౌల్ బ్రూడ్ వ్యాధి లక్షణాలు (European foulbrood symptoms)",
                    "Apis mellifera",
                  ],
                  ["నోసిమా వ్యాధి లక్షణాలు (Nosema symptoms)", "Apis cerana"],
                ]}
              />
            </section>

            <section id="page13" className="card">
              <SectionHead
                te="తేనీటీగల వ్యాధులు"
                en="Honey bee diseases, continued"
                page={13}
              />
              <DataTable
                headers={["తెలుగు", "English"]}
                rows={[
                  ["అమెరికన్ పౌల్ బ్రూడ్ వ్యాధి", "American foulbrood"],
                  ["యూరోపియన్ పౌల్ బ్రూడ్ వ్యాధి", "European foulbrood"],
                  ["బూజు తెగులు (చాక్ బ్రూడ్ వ్యాధి)", "Chalkbrood"],
                  ["శాక్ బ్రూడ్ వ్యాధి", "Sacbrood"],
                  ["థాయ్ శాక్ బ్రూడ్ వ్యాధి", "Thai sacbrood"],
                ]}
              />
            </section>

            <section id="page14" className="card">
              <SectionHead
                te="తేనీటీగల శత్రువులు"
                en="Enemies of honey bees"
                page={14}
              />
              <DataTable
                headers={["తెలుగు", "English"]}
                rows={[
                  ["వరోవా నల్లి (తేనెటీగ మీద)", "Varroa mite on adult bee"],
                  ["లార్వా మీద వరోవా నల్లి", "Varroa mite on larva"],
                  ["నోసిమా వ్యాధి", "Nosema disease"],
                  ["మైనపు రెక్కల పురుగు", "Wax moth larva (damages comb)"],
                ]}
              />
            </section>

            <section id="page15" className="card">
              <SectionHead
                te="తేనీటీగల సమస్యలు"
                en="Colony problems"
                page={15}
              />
              <ul>
                <li>
                  తేనీటీగల దొంగలింపు (రాబింగ్) - Robbing (bees stealing honey
                  from other colonies)
                </li>
                <li>
                  తేనీటీగలు వలస పోవుట (స్వార్మింగ్) - Swarming (colony splits
                  and bees leave the hive)
                </li>
              </ul>
            </section>

            <section id="page16" className="card">
              <SectionHead
                te="తేనీటీగల ఉత్పత్తులు"
                en="Products of honey bees"
                page={16}
              />
              <DataTable
                headers={["తెలుగు", "English"]}
                rows={[
                  ["పుప్పొడి", "Pollen"],
                  ["సౌందర్య సాధనాలు", "Cosmetics"],
                  ["ప్రొపోలిస్ ఆయిల్", "Propolis oil"],
                  ["ముడి మైనము", "Raw beeswax"],
                  ["ప్రొపోలిస్", "Propolis"],
                  ["ప్రొపోలిస్ షాంపూ", "Propolis shampoo"],
                  ["ప్రొపోలిస్ సబ్బు", "Propolis soap"],
                  ["రాజాహారము", "Royal jelly"],
                  ["ముడి తేనె", "Raw honey"],
                ]}
              />
            </section>
          </>
        )}
      </main>
    </>
  );
}
