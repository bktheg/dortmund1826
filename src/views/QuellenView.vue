<script setup lang="ts">
import hausnummernJpg from '../assets/hausnummern.jpg'
import infotextJpg from '../assets/infotext.jpg'
</script>

<template>
    <div id="contentview">
        <div id="content">
            <h1>Dargestellte Informationen</h1>
            <p>Zur Karte existiert ein kurzes <a href="https://youtu.be/4VQwyPPRPCY">Info-Video</a> (nicht mehr ganz aktuell).</p>
            <p>
                Zu jedem Flurstück werden, abhängig von der Zoomstufe, weiterführende Informationen angezeigt, soweit diese bereits erfasst sind. Dies können sein: Flur, Flurstück, Eigentümer, Größe in preußischen Morgen, Ruten und Fuß sowie die Kulturart und als was das Flurstück taxiert wurde.
            </p>
            <p>
                <img width="400" :src="infotextJpg" alt="Dargestellte Informationen"/>
            </p>
            <p>
                Für die Stadt Dortmund sind außerdem die alten napoleonischen Hausnummern an den Gebäuden hinterlegt. Diese werden bei der entsprechenden Zoomstufe in weißer Schrift auf blauem Grund angezeigt. Die Zuordnung basiert auf der Hausnummernliste aus dem Adressbuch 1874 und dem Dortmunder Häuserbuch von Robert von den Berken von 1927. Die alten Hausnummern galten in Dortmund bis Anfang der 1870er. Die Wohnhäuser waren anders als heute nicht pro Straße durchnummeriert. Stattdessen hat man an der Südwestecke des Ostentors mit der 1 angefangen und an der gegenüberliegenden Ecke mit der 887 aufgehört. Die Hausnummern waren für die gesamte Stadt fortlaufend. Außerhalb der Stadt gab es keine Hausnummern. Neue Hausnummern wurden zwischen zwei bestehenden eingefügt, entsprechend des Standorts des Gebäudes. Dies führte am Ende zu Hausnummern wie "655 1/4e" für die Katharinenstraße 1 oder "45n II" für das Haus Ostwall 39.
            </p>
            <p>
                <img width="300" :src="hausnummernJpg" alt="Hausnummern"/>
            </p>
            <p>
                Die Karte ersetzt weder eine Katasterauskunft noch Anfragen an Vermessungsämter und soll dies auch ausdrücklich nicht. Die Karte basiert zwar in großen Teilen auf den überlieferten Urkatasterunterlagen, ist aber selbst keine Katasterkarte.
            </p>
            <p>
                Alle Angaben ohne Gewähr. Bei Fehlern, Hinweisen, Anregungen oder Ergänzungsvorschlängen würde ich mich über eine kurze Email (s.u.) sehr freuen.
            </p>
            <h1>Suchfunktion</h1>
            <p>
                Die Suche ist in der oberen rechten Ecke zu finden. Sie erlaubt die Suche entweder nach Ortsangaben (Dörfer, Orte, Bezeichnungen, Gewässer und dergleichen) oder nach Eigentümern.
                Die Suche erfolgt automatisch nach Eingabe des Suchtexts. Platzhalter werden bei nicht unterstützt. Die Suche kann auf einzelne Kreise, Bürgermeistereien oder Gemeinden eingeschränkt werden.
            </p>
            <p>
                Beim Klick auf eine Ortsangabe verschiebt sich die Karte automatisch an den entsprechenden Ort. Beim Klick auf einen Eigentümer wird sein Besitz aufgelistet. Dort findet sich auch die Artikelnummer. Diese ist für weitere Recherchen im Kataster sehr hilfreich.
                Klickt man dort auf eine Parzelle verschiebt sich die Karte wiederum zu dieser. Bei einigen Eigentümern finden sich außerdem Angaben wie "P" und "E" im Namen. Diese stehen für Pächter und Eigentümer. In einigen, jedoch nicht in allen Gemeinden wurde dies im Kataster aufgeschlüsselt.
            </p>
            <h1>Administrative Grenzen</h1>
            <p>Das heutige Dortmunder Stadtgebiet umfasst Teile des damaligen Kreises Dortmund sowie eines sehr kleinen Teils des Kreises Bochum. 1826 waren die Kreise weiter in Bürgermeistereien untergliedert. Dortmund umfasste die Bürgermeistereien Aplerbeck, Castrop, Dortmund, Hörde, Lünen und Lütgendortmund. Die Bürgermeistereien gliederten sich ihrerseits mehrere Gemeinden auf. Jede Gemeinde bestand im Kataster aus einem oder mehreren Fluren.</p>
            <p>Die aufgeführten Gemeinden und ihre Grenzen basieren auf den Angaben auf den Urkarten des Urkatasters. Andere Quellen nennen zum Teil abweichende Gemeinden für den fraglichen Zeitraum, auch wird teils zwischen Steuergemeinden und Etatgemeinden unterschieden. Klarer wird die Überlieferung leider erst mit Einführung der Ämter in der Provinz Westfalen 1843.</p>
            <h1>Quellenangaben</h1>
            <p>
            Die <a href="https://dortmund1826.de">Karte Dortmunds um 1826</a> wurde auf Basis der Bestände 162/01 (Katasterkarten), 162/02 (Trigonometrische Unterlagen) und 162/03 (Flurbücher) des <a href="https://www.dortmund.de/de/freizeit_und_kultur/stadtarchiv/start_stadtarchiv/index.html">Stadtarchivs Dortmund</a> und der Bestände K551 (Katasterbücher im Regierungsbezirk Arnsberg) und W052/Karten K (Katasterkarten) des <a href="https://www.archive.nrw.de/landesarchiv-nrw/landesarchiv-nrw-abteilung-westfalen-muenster">Landesarchivs NRW Abteilung Westfalen</a> erstellt. Sie zeigt den Zustand Dortmunds, wie dieser im Urkataster 1826/27 dokumentiert wurde, ohne Berücksichtigung von Fortschreibungen und Nachtragungen.</p>
            <p>Die Basis ist das Vermessungsnetz (Polygonnetz) des Urkatasters (Best. 162/02). Mittels des Netzes wurden dann die Urkarten georeferenziert und unter Zuhilfenahme der Übersichtshandrisse und Stückvermessungshandrisse digitalisiert (Best. 162/01). Kulturarten, Größen (in Morgen, Ruten und Fuß) und Eigentumsverhältnisse sind aus den Flurbüchern entnommen (Best. 162/03). Ortsbezeichnungen entstammen den Urkarten, den Stückvermessungshandrissen und teils auch den Flurbüchern. Wegen der teils schlechten Lesbarkeit fehlen einige Angaben. Zudem ist hier mit Fehlern zu rechnen.</p>
            <p>Auf eine manuelle Korrektur/Einpassung der Karte wurde verzichtet. Es kommt daher zu gewissen Abweichungen zwischen dieser und heutigen Karten.</p>
            <p>Weitere Quellen:
                <ul>
                    <li>Dortmund: Dortmunder Häuserbuch, Robert von den Berken, 1927; Adressbuch 1874</li>
                    <li>Mengede: Karte Schott / Heimatverein Mengede e.V.</li>
                </ul>
            </p>
            <h1>Umfang der Karte</h1>           
            <p>Die im folgenden aufgelisteten damaligen Flure sind bereits digitalisiert und damit Teil der Karte. Weitere Gemeinden/Flure sind in Vorbereitung. Zu jedem Flur ist aufgeführt, in welchem Archiv sich die Originalquellen (Vermessungsunterlagen, Flurbuch, Urkarten) befinden.</p>
            <table class="flure">
                <thead>
                    <th>Kreis</th>
                    <th>Bürgermeisterei</th>
                    <th>Gemeinde</th>
                    <th>Flur</th>
                    <th>Name</th>
                    <th>Quellen Vermessung</th>
                    <th>Quellen Flurbuch</th>
                    <th>Quellen Urkarten</th>
                </thead>
                <tbody>
                    <tr v-for="flur in flure">
                        <td>{{flur.kreis}}</td>
                        <td>{{flur.bmstr}}</td>
                        <td>{{flur.gem}}</td>
                        <td>{{flur.nr}}</td>
                        <td>{{flur.name}}</td>
                        <td>{{expandSource(flur.qverm)}}</td>
                        <td>{{expandSource(flur.qbuch)}}</td>
                        <td>{{expandSource(flur.qmap)}}</td>
                    </tr>
                </tbody>
            </table>
            <p v-for="quelle in flureQuellen">{{quelle}}</p>
            <h1>Autor</h1>
            <p>Christopher Jung • dortmund1909@email.de • <a href="https://www.youtube.com/c/ChristopherJung/">YouTube</a> • <a href="https://www.facebook.com/christopher.jung.370">Facebook</a></p>
        </div>
    </div>
</template>

<script lang="ts">
import { storeToRefs } from 'pinia'
import {useFlurStore} from '../stores/flurStore'

const { flure } = storeToRefs(useFlurStore())
const { fetchFlure } = useFlurStore()

fetchFlure()

export default {
    data() {
        return {
            flureQuellen:[] as string[]
        }
    },
    async mounted() {
        const flurStore = useFlurStore();
        flurStore.$subscribe((mutation,state) => {
            const sources = new Set<string|null>();

            state.flure.forEach((f) => {sources.add(f.qbuch); sources.add(f.qmap); sources.add(f.qverm)});

            const quellen = [];
            if( sources.has(null) || sources.has("") ) {
                quellen.push("¹ Stadtarchiv Dortmund. Bestände 162/001 (Karten), 162/002 (Vermessung) und 162/003 (Flurbücher)")
            }
            if( sources.has("LAV") ) {
                quellen.push("² Landesarchiv NRW Abteilung Westfalen. Bestände K551 (Vermessung und Flurbücher) und W052/Karten K (Karten)")
            }
            this.flureQuellen = quellen;
        })
    },
    methods: {
        expandSource: function(source:string) {
            if( source == null || source.trim() == "" ) {
                return "StDo¹";
            }
            if( source == "LAV" ) {
                return "LAV NRW W²"
            }
            return source;
        }
    }
}
</script>

<style>
    .flure th {
        text-align: left;
        font-weight: bold;
        padding: 2pt 8pt 0pt 0pt;
    }
    .flure td {
        padding: 2pt 8pt 0pt 0pt;
    }
    .flure {
        margin-bottom:10pt;
    }
</style>
