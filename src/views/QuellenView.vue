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
                Zu jeder Parzelle werden, abhängig von der Zoomstufe, weiterführende Informationen angezeigt, soweit diese bereits erfasst sind. Dies können sein: Flur, Flurstück, Eigentümer, Größe in preußischen Morgen, Ruten und Fuß sowie die Kulturart und als was die Parzelle taxiert wurde.
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
            <p>Die <a href="https://dortmund1826.de">Karte Dortmunds um 1826</a> wurde auf Basis der Bestände verschiedener Archive und Katasterämter erstellt. Die genaue Quellenangabe der einzelnen Bestände einer jeden Flur ist in der Tabelle weiter unten zu finden. Die Karte zeigt hierbei den Zustand, wie dieser im Urkataster um 1826/27 dokumentiert wurde, ohne Berücksichtigung von Fortschreibungen und Nachtragungen.</p>
            <p>Die Basis ist das Vermessungsnetz (Polygonnetz) des Urkatasters (Best. 162/02). Mittels des Netzes wurden dann die Urkarten georeferenziert und unter Zuhilfenahme der Übersichtshandrisse und Stückvermessungshandrisse digitalisiert (Best. 162/01). Kulturarten, Größen (in Morgen, Ruten und Fuß) und Eigentumsverhältnisse sind aus den Flurbüchern entnommen. Ortsbezeichnungen entstammen den Urkarten, den Stückvermessungshandrissen und teils auch den Flurbüchern. Wegen der teils schlechten Lesbarkeit fehlen einige Angaben. Zudem ist hier mit Fehlern zu rechnen. Auf eine manuelle Korrektur/Einpassung der Karte wurde verzichtet. Es kommt daher zu gewissen Abweichungen zwischen dieser und heutigen Karten.</p>
            <p>Konkret wurde von mir Material der folgenden Archive und Katasterämter verwendet. <b>Allen an dieser Stelle einen ganz herzlichen Dank für die Bereitstellung!</b></p>
            
            <h2 id="quelle-sta-dortmund">Stadtarchiv Dortmund</h2>
            <p>Basis für das heutige Dortmunder Stadtgebiet sind die Bestände 162/001 (Katasterkarten), 162/002 (Trigonometrische Unterlagen) und 162/003 (Flurbücher) des <a href="https://www.dortmund.de/de/freizeit_und_kultur/stadtarchiv/start_stadtarchiv/index.html">Stadtarchivs Dortmund</a>. Zur Validierung und Vervollständigung der Eigentümernamen wurde teils auch auf die Mutterrollen (Best. 162/005) und Güterverzeichnisse (Best. 162/007) zurückgegriffen.</p>
            
            <h2 id="quelle-lav-nrw-w">Landesarchiv NRW Abteilung Westfalen</h2>
            <p>Basis sind die Bestände K551 (Katasterbücher im Regierungsbezirk Arnsberg) und W052/Karten K (Katasterkarten) des <a href="https://www.archive.nrw.de/landesarchiv-nrw/landesarchiv-nrw-abteilung-westfalen-muenster">Landesarchivs NRW Abteilung Westfalen</a></p>
            
            <template v-if="hasSource('KA Recklinghausen')">
                <h2 id="quelle-ka-recklinghausen">Katasteramt des Kreises Recklinghausen</h2>
                <p>
                    Basis sind die vom Katasteramt des Kreises Recklinghausen für dortmund1826.de bereitgestellten Urkarten, Stückvermessungshandrisse und Flurbücher. Die Georeferenzierung der Urkarten wurde durch das Katasteramt selbst vorgenommen.
                </p>
                <p class="legal">
                    Grundlage: Urkarten und Geobasisdaten © Kreis Recklinghausen<br/>
                    Veröffentlicht mit freundlicher Genehmigung des Katasteramtes des Kreises Recklinghausen<br/>
                    <br />
                    Weitere historischen Urkarten stehen im <a target="_blank" href="https://www.kreis-re.de/Inhalte/Buergerservice/_index2.asp?seite=angebot&id=19543"><b>geo</b>atlas</a> des Kreises Recklinghausen zur Einsicht bereit.<br/>
                    Im Kreisgebiet gibt es ca. 1.300 historische Urkarten aus dem Zeitraum von 1820 bis 1888, welche in einer interaktiven Karte und als Einzelkarte eingesehen werden können.
                </p>
            </template>
            
            <h2>Weitere Quellen</h2>
            <p>
                <ul>
                    <li>Dortmund: Dortmunder Häuserbuch, Robert von den Berken, 1927; Adressbuch 1874</li>
                    <li>Mengede: Karte Schott / Heimatverein Mengede e.V.</li>
                </ul>
            </p>
            <h1>Umfang der Karte</h1>           
            <p>Die im folgenden aufgelisteten damaligen Fluren sind bereits digitalisiert und damit Teil der Karte. Weitere Gemeinden/Fluren des Kreises Dortmund sind in Vorbereitung. Die gesuchte Gemeinde (in der Umgebung Dortmunds) ist noch nicht dabei? Meldet euch gerne per Mail bei mir (siehe unten). Auch Hilfe bei der Digitalisierung ist jederzeit willkommen und wenn es nur die Suche nach Unterlagen oder das Abschreiben von Flurbüchern ist.</p>
            <p>Zu jeder Flur ist aufgeführt, in welchem Archiv sich die Originalquellen (Vermessungsunterlagen, Flurbuch, Urkarten) befinden.</p>
            <table class="fluren">
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
                        <td><abbr :title="expandSourceToText(flur.qverm)" v-html="expandSourceToAbbr(flur.qverm)"></abbr></td>
                        <td><abbr :title="expandSourceToText(flur.qbuch)" v-html="expandSourceToAbbr(flur.qbuch)"></abbr></td>
                        <td><abbr :title="expandSourceToText(flur.qmap)" v-html="expandSourceToAbbr(flur.qmap)"></abbr></td>
                    </tr>
                </tbody>
            </table>
            <h1>Literatur</h1>
            <p>Weiterführende Literaturempfehlungen zum Thema Katasterwesen und Urkataster:
                <ul>
                    <li>Vermessung in Dortmund. Beiträge zur Geschichte des Vermessungs- und Katasterwesens. Stadt Dortmund, Vermessungs- und Katasteramt. Dortmund, 1976</li>
                    <li>Geschichte des Grundsteuer- und Vermessungswesens im Herzogtum Westfalen. Klemens Wiesemann. Herausgegeben vom Schieferbergbau- und Heimatmuseum Holthausen. Fredeburg, 1993</li>
                    <li>Die Urkatasteraufnahme in Westfalen. Veröffentlichungen des Landesarchivs Nordrhein-Westfalen 20. Gerald Kreucher. Düsseldorf, 2008</li>
                </ul>
            </p>
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
            quellenIds:new Set<string|null>
        }
    },
    async mounted() {
        const flurStore = useFlurStore();
        flurStore.$subscribe((mutation,state) => {
            const sources = new Set<string|null>();

            state.flure.forEach((f) => {sources.add(f.qbuch); sources.add(f.qmap); sources.add(f.qverm)});
            this.quellenIds = sources;
        })
    },
    methods: {
        hasSource: function(sourceId:string|null) {
            return this.quellenIds.has(sourceId);
        },
        expandSourceToAbbr: function(source:string|null) {
            if( source == null || source.trim() == "" ) {
                return '<a href="#quelle-sta-dortmund">StADo</a>';
            }
            if( source == "LAV" ) {
                return '<a href="#quelle-lav-nrw-w">LAV NRW W</a>'
            }
            if( source == "KA Recklinghausen" ) {
                return '<a href="#quelle-ka-recklinghausen">Recklinghausen</a>'
            }
            if( source == "KA Ennepe-Ruhr" ) {
                return '<a href="#quelle-ka-ennepe-ruhr">Ennepe-Ruhr</a>'
            }
            return source;
        },
        expandSourceToText: function(source:string|null) {
            if( source == null || source.trim() == "" ) {
                return "Stadtarchiv Dortmund. Bestände 162/001 (Karten), 162/002 (Vermessung) und 162/003 (Flurbücher)";
            }
            if( source == "LAV" ) {
                return "Landesarchiv NRW Abteilung Westfalen. Bestände K551 (Vermessung und Flurbücher) und W052/Karten K (Karten)"
            }
            if( source == "KA Recklinghausen" ) {
                return "Katasteramt des Kreises Recklinghausen. Grundlage: Urkarten und Geobasisdaten © Kreis Recklinghausen. Veröffentlicht mit freundlicher Genehmigung des Katasteramtes des Kreises Recklinghausen."
            }
            if( source == "KA Ennepe-Ruhr" ) {
                return "Katasteramt des Kreises Ennepe-Ruhr"
            }
            return source;
        }
    }
}
</script>

<style>
    h1 {
        margin-top:12pt;
    }
    h2 {
        margin-top:6pt;
    }
    h1:first-child, h2:first-child {
        margin-top:0pt;
    }
    .legal {
        margin-top:10pt;
    }
    .fluren th {
        text-align: left;
        font-weight: bold;
        padding: 2pt 8pt 0pt 0pt;
    }
    .fluren td {
        padding: 2pt 8pt 0pt 0pt;
    }
    .fluren {
        margin-bottom:10pt;
    }
    .fluren abbr a {
        color: rgb(44,62,80);
        text-decoration:none;
    }
</style>
