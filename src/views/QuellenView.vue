<script setup lang="ts">
import hausnummernJpg from '../assets/hausnummern.jpg'
import infotextJpg from '../assets/infotext.jpg'
import {expandSourceToAbbr, expandSourceToText} from '../services/quellenService'
</script>

<template>
    <div id="contentview">
        <div class="content quellen">
            <ol class="table-of-contents" role="list">
                <li><a href="#dargestellte-informationen">Dargestellte Informationen</a></li>
                <li><a href="#administrative-grenzen">Administrative Grenzen</a></li>
                <li><a href="#funktionen">Funktionen</a></li>
                <li><a href="#quellen">Quellen</a></li>
                <li><a href="#umfang-der-karte">Umfang der Karte</a></li>
                <li><a href="#hintergrundkarten">Hintergrundkarten</a></li>
                <li><a href="#literatur">Literatur</a></li>
                <li><a href="#software">Software und Rohdaten</a></li>
                <li><a href="#autor">Autor/Kontakt</a></li>
            </ol>


            <h1 id="dargestellte-informationen">Dargestellte Informationen</h1>
            <p>
                Zur Karte existieren ein kurzes <a href="https://youtu.be/Wl6zQ7XfHtQ">Info-Video</a>, das alle wesentlichen Funktionen einmal vorstellt (Stand: Ende März 2023).
                Informationen zum Urkataster, der Hauptquelle der Karte, sind in <a href="https://youtu.be/wh2ON3tV8K8">diesem Video</a> zu finden.
                Die Vorgehensweise bei der Erstellung der Karte ist wiederum in <a href="https://youtu.be/HzDaPHdLtjc">diesem Video</a> erläutert.
            </p>
            <p>
                Zu jeder Parzelle werden, abhängig von der Zoomstufe, weiterführende Informationen angezeigt, soweit diese bereits erfasst sind. Dies können sein: Flur, Flurstück, Eigentümer, Größe in preußischen Morgen, Ruten und Fuß sowie die Kulturart und als was die Parzelle taxiert wurde.
            </p>
            <p>
                <img width="400" :src="infotextJpg" alt="Dargestellte Informationen"/>
            </p>
            <p>
                Für Dortmund, Huckarde, Mengede und teilweise auch Hörde sind die alten napoleonischen Hausnummern an den Gebäuden hinterlegt. 
                Diese werden bei der entsprechenden Zoomstufe in weißer Schrift auf blauem Grund angezeigt.
                Weitere Orte werden ergänzt, sofern passende Quellen zu finden sind (Hausnummerlisten, Eigentümerlisten, Karten). Hinweise werden dankend angenommen.
            </p>
            <p>
                Die Zuordnung basiert für Dortmund auf der Hausnummernliste aus dem Adressbuch 1874 und dem Dortmunder Häuserbuch von Robert von den Berken von 1927.
                Die alten Hausnummern galten in Dortmund bis Anfang der 1870er.
                Die Wohnhäuser waren anders als heute nicht pro Straße durchnummeriert,
                stattdessen hat man an der Südwestecke des Ostentors mit der 1 angefangen und an der gegenüberliegenden Ecke mit der 887 aufgehört. 
                Die Hausnummern waren für die gesamte Stadt fortlaufend. Außerhalb der Stadt gab es keine Hausnummern. 
                Neue Hausnummern wurden zwischen zwei bestehenden eingefügt, entsprechend des Standorts des Gebäudes. 
                Dies führte am Ende zu Hausnummern wie "655 1/4e" für die Katharinenstraße 1 oder "45n II" für das Haus Ostwall 39.
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

            <h1 id="administrative-grenzen">Administrative Grenzen</h1>
            <p>
                Zum Zeitpunkt der Aufstellung des Urkatasters waren die Kreise in Bürgermeistereien untergliedert.
                Die Bürgermeistereien gliederten sich ihrerseits mehrere Gemeinden auf. Jede Gemeinde bestand im Kataster aus einem oder mehreren Fluren.
            </p>
            <p>
                Die aufgeführten Gemeinden und ihre Grenzen basieren auf den Angaben auf den Urkarten des Urkatasters.
                Andere Quellen nennen zum Teil abweichende Gemeinden für den fraglichen Zeitraum, auch wird teils zwischen Steuergemeinden und Etatgemeinden unterschieden.
                Klarer wird die Überlieferung leider erst mit Einführung der Ämter in der Provinz Westfalen 1843.
            </p>
            <p>
                Das heutige Dortmunder Stadtgebiet umfasst Teile des damaligen Kreises Dortmund sowie eines sehr kleinen Teils des Kreises Bochum.
                Der Kreis Dortmund umfasste damals die Bürgermeistereien Aplerbeck, Castrop, Dortmund, Hörde, Lünen, Lütgendortmund und Schwerte.
            </p>

            <h1 id="funktionen">Funktionen</h1>
            <h2>Suchfunktion</h2>
            <p>
                Die Suche ist in der oberen rechten Ecke zu finden. Sie erlaubt die Suche entweder nach Ortsangaben (Dörfer, Orte, Bezeichnungen, Gewässer und dergleichen), Eigentümern, Parzellen und Einträgen in Häuserbüchern (aktuell ist nur das Dortmunder Häuserbuch hinterlegt).
                Die Suche erfolgt automatisch nach Eingabe des Suchtexts. Platzhalter werden bei nicht unterstützt. Die Suche kann auf einzelne Kreise, Bürgermeistereien oder Gemeinden eingeschränkt werden.
            </p>
            <p>
                Beim Klick auf eine Ortsangabe verschiebt sich die Karte automatisch an den entsprechenden Ort. Beim Klick auf einen Eigentümer wird sein Besitz aufgelistet. Dort findet sich auch die Artikelnummer. Diese ist für weitere Recherchen im Kataster sehr hilfreich.
                Klickt man dort auf eine Parzelle verschiebt sich die Karte wiederum zu dieser. Bei einigen Eigentümern finden sich außerdem Angaben wie "P" und "E" im Namen. Diese stehen für Pächter und Eigentümer. In einigen, jedoch nicht in allen Gemeinden wurde dies im Kataster aufgeschlüsselt.
            </p>
            <h2>Parzellen untersuchen</h2>
            <p>
                Über die Funktion "Parzellen untersuchen" am oberen linken Rand der Karte können Details zu einzelnen Parzellen angezeigt werden. Durch einen Klick auf das Symbol wird die Funktion aktiviert und einzelne Parzellen können nun untersucht werden. Durch einen weiteren Klick wieder deaktiviert. Neben den auf der Karte dargestellten Informationen werden für untersuchte Parzellen beispielsweise die Klasse, die Artikelnummer, die Lage und (falls vorhanden) der Reinertrag angezeigt. Auch weiterführende Quellenangaben sind hier zu finden.
            </p>

           
            <h1 id="quellen">Quellen</h1>
            <p>Die <a href="https://dortmund1826.de">Karte Dortmunds um 1826</a> wurde auf Basis der Bestände verschiedener Archive und Katasterämter erstellt. Die genaue Quellenangabe der einzelnen Bestände einer jeden Flur ist in der Tabelle weiter unten zu finden. Die Karte zeigt hierbei den Zustand, wie dieser im Urkataster um 1826/27 dokumentiert wurde, ohne Berücksichtigung von Fortschreibungen und Nachtragungen.</p>
            <p>Die Basis ist das Vermessungsnetz (Polygonnetz) des Urkatasters (Best. 162/02). Mittels des Netzes wurden dann die Urkarten georeferenziert und unter Zuhilfenahme der Übersichtshandrisse und Stückvermessungshandrisse digitalisiert (Best. 162/01). Kulturarten, Größen (in Morgen, Ruten und Fuß), Reinerträge (in Taler, Groschen und Pfennig) und Eigentumsverhältnisse sind aus den Flurbüchern entnommen. Ortsbezeichnungen entstammen den Urkarten, den Stückvermessungshandrissen und teils auch den Flurbüchern. Wegen der teils schlechten Lesbarkeit fehlen einige Angaben. Zudem ist hier mit Fehlern zu rechnen. Auf eine manuelle Korrektur/Einpassung der Karte wurde verzichtet. Es kommt daher zu gewissen Abweichungen zwischen dieser und heutigen Karten.</p>
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

                <p class="legal" v-html="getLegalText('KA Recklinghausen')"/>
            </template>

            <template v-if="hasSource('KA Ennepe-Ruhr')">
                <h2 id="quelle-ka-ennepe-ruhr">Liegenschaftskataster u. Geoinformation des Ennepe-Ruhr-Kreises</h2>
                <p>
                    Basis sind die vom Liegenschaftskataster u. der Geoinformation des Ennepe-Ruhr-Kreises für dortmund1826.de bereitgestellten Urkarten, Stückvermessungshandrisse, Flurbücher und Vermessungsunterlagen.
                </p>

                <p class="legal" v-html="getLegalText('KA Ennepe-Ruhr')"/>
            </template>

            <template v-if="hasSource('KA Hagen')">
                <h2 id="quelle-ka-hagen">Fachbereich Geoinformation und Liegenschaftskataster der Stadt Hagen</h2>
                <p>
                    Basis sind die vom Fachbereich Geoinformation und Liegenschaftskataster der Stadt Hagen für dortmund1826.de bereitgestellten Urkarten und Flurbücher.
                </p>

                <p class="legal" v-html="getLegalText('KA Hagen')"/>
            </template>

            <template v-if="hasSource('KA Herne')">
                <h2 id="quelle-ka-herne">Fachbereich Kataster und Geoinformation der Stadt Herne</h2>
                <p>
                    Basis sind die vom Fachbereich Kataster und Geoinformation der Stadt Herne für dortmund1826.de bereitgestellten Urkarten und Flurbücher.
                </p>
            </template>
            
            <h2>Weitere Quellen</h2>
            <p>
                <ul>
                    <li>Dortmund: Dortmunder Häuserbuch, Robert von den Berken, 1927; Adressbuch 1874</li>
                    <li>Huckarde: Verzeichnis derjenigen Haus Nummern die sich in der Commune Huckarde befinden pro 1825, in: Stadtarchiv Dortmund, Best. 3-1047</li>
                    <li>Mengede: Karte Schott, Einwohnerverzeichnis Bürgermeisterei Castrop 1849 (herzlichen Dank an den Heimatverein Mengede e.V.)</li>
                </ul>
            </p>


            <h1 id="umfang-der-karte">Umfang der Karte</h1>           
            <p>
                Die im folgenden aufgelisteten damaligen Fluren sind bereits digitalisiert und damit Teil der Karte.
                Weitere Gemeinden/Fluren des Kreises Dortmund sind in Vorbereitung. Die gesuchte Gemeinde (in der Umgebung Dortmunds) ist noch nicht dabei? 
                Meldet euch gerne per Mail bei mir (siehe unten). Auch Hilfe bei der Digitalisierung ist jederzeit willkommen und wenn es nur die Suche nach 
                Unterlagen oder das Abschreiben von Flurbüchern ist.
            </p>
            <p>Zu jeder Flur ist aufgeführt, in welchem Archiv sich die Originalquellen (Vermessungsunterlagen, Flurbuch, Urkarten) befinden.</p>
            <div class="fluren">
                <table>
                    <thead>
                        <tr>
                            <th>Kreis</th>
                            <th>Bürgermeisterei</th>
                            <th>Gemeinde</th>
                            <th>Flur</th>
                            <th>Name</th>
                            <th>Quellen Vermessung</th>
                            <th>Quellen Flurbuch</th>
                            <th>Quellen Urkarten</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="flur in flure">
                            <td>{{flur.gemeinde?.buergermeisterei.kreis.name}}</td>
                            <td>{{flur.gemeinde?.buergermeisterei.name}}</td>
                            <td>{{flur.gemeinde?.name}}</td>
                            <td>{{flur.nr}}</td>
                            <td>{{flur.name}}</td>
                            <td><abbr :title="expandSourceToText(flur.gemeinde?.quelleVermessung)" v-html="expandSourceToAbbr(flur.gemeinde?.quelleVermessung)"></abbr></td>
                            <td><abbr :title="expandSourceToText(flur.gemeinde?.quelleFlurbuch)" v-html="expandSourceToAbbr(flur.gemeinde?.quelleFlurbuch)"></abbr></td>
                            <td><abbr :title="expandSourceToText(flur.quelleUrkarten)" v-html="expandSourceToAbbr(flur.quelleUrkarten)"></abbr></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h1 id="hintergrundkarten">Hintergrundkarten</h1>
            <h2>Uraufnahme (1836-1850)</h2>
            <p>Die Preußische Kartenaufnahme wurde in den Jahren 1836-1850 für die Provinzen Rheinland und Westfalen im Maßstab 1:25.000 angefertigt. Die Karte wird von <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/topographische_karten/historisch/1836/index.html">Geobasis NRW</a> im Onlineverfahren ohne Einschränkungen oder Bedingungen bereitgestellt. Die Karte steht nicht in allen Zoomstufen zur Verfügung.</p>
            <h2>Neuaufnahme (1891-1912)</h2>
            <p>Die Preußische Kartenaufnahme wurde als Neuaufnahme in den Jahren 1891-1912 für das gesamten Landesgebiet Preußens im Maßstab 1:25.000 angefertigt. Die Karte wird von <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/topographische_karten/historisch/1891/index.html">Geobasis NRW</a> im Onlineverfahren ohne Einschränkungen oder Bedingungen bereitgestellt. Die Karte steht nicht in allen Zoomstufen zur Verfügung.</p>
            <h2>Heute</h2>
            <p>Eine Karte des heutigen Zustands. Die Karte wird bereitgestellt von <a href="https://www.mapbox.com/about/maps/">Mapbox</a> und basiert auf den Daten von <a href="https://www.openstreetmap.org/about/">OpenStreetMap</a>.</p>
            
            
            <h1 id="literatur">Literatur</h1>
            <p>Weiterführende Literaturempfehlungen zum Thema Katasterwesen und Urkataster:
                <ul>
                    <li>Vermessung in Dortmund. Beiträge zur Geschichte des Vermessungs- und Katasterwesens. Stadt Dortmund, Vermessungs- und Katasteramt. Dortmund, 1976</li>
                    <li>Geschichte des Grundsteuer- und Vermessungswesens im Herzogtum Westfalen. Klemens Wiesemann. Herausgegeben vom Schieferbergbau- und Heimatmuseum Holthausen. Fredeburg, 1993</li>
                    <li>Die Urkatasteraufnahme in Westfalen. Veröffentlichungen des Landesarchivs Nordrhein-Westfalen 20. Gerald Kreucher. Düsseldorf, 2008</li>
                </ul>
            </p>

            <h1 id="Software">Software und Rohdaten</h1>
            <p>
                Die für die Datenaufbereitung im Rahmen von dortmund1826 geschriebene Software steht auf github unter MIT-Lizenz zur Verfügung: <a href="https://github.com/bktheg/genmap">genmap-Tool</a>.
                Der Sourcecode zu dieser Website steht ebenfalls auf github unter MIT-Lizenz bereit: <a href="https://github.com/bktheg/dortmund1826">dortmund1826</a>
            </p>
            <p>
                Teile der für dortmund1826 verwendeten Rohdaten stehen unter der Open Data Commons Attribution License allen Interessenten zur Verfügung: <a href="https://github.com/bktheg/dortmund1826-data">dortmund1826-data</a>.
                Die Daten sind größtenteils in Exceldateien erfasst.
            </p>

            <h1 id="autor">Autor/Kontakt</h1>
            <p>Christopher Jung • dortmund1909@email.de • <a href="https://www.youtube.com/c/ChristopherJung/">YouTube</a> • <a href="https://www.facebook.com/christopher.jung.370">Facebook</a></p>
        </div>
    </div>
</template>

<script lang="ts">
import { storeToRefs } from 'pinia'
import {useFlurStore} from '../stores/flurStore'

const { flure } = storeToRefs(useFlurStore())

export default {
    data() {
        return {
            quellenIds:new Map<string|null,Set<string|null>>()
        }
    },
    async mounted() {
        const flurStore = useFlurStore();
        flurStore.fetchFlure();
        flurStore.$subscribe((mutation,state) => {
            state.flure.forEach((f) => {
                this.addSource(f.gemeinde?.quelleFlurbuch, null);
                this.addSource(f.gemeinde?.quelleVermessung, null);
                this.addSource(f.quelleUrkarten, f.legalText||null);
            });
        },{immediate:true})
    },
    methods: {
        hasSource: function(sourceId:string|null) {
            for( const flur of flure.value ) {
                if( flur.gemeinde?.quelleFlurbuch == sourceId ||
                    flur.gemeinde?.quelleVermessung == sourceId ||
                    flur.quelleUrkarten == sourceId ) {
                    return true;
                }
            }
            return false;
        },
        getLegalText: function(sourceId:string|null) {
            const value = this.quellenIds.get(sourceId)
            if( !value ) {
                return null;
            }
            return [...value.values()].filter(t => t != null && t != '').join("<br/><br/>");
        },
        addSource: function(sourceId:string, legalText:string|null) {
            if( sourceId.includes(':') ) {
                sourceId = sourceId.split(':')[0]
            }
            if( this.quellenIds.has(sourceId) ) {
                this.quellenIds.get(sourceId)?.add(legalText);
            }
            else {
                this.quellenIds.set(sourceId, new Set<string|null>([legalText]));
            }
        }
    }
}
</script>

<style>
    .quellen {
        text-align: justify
    }

    .quellen p {
        margin: 5pt 0pt
    }

    h1:first-child, h2:first-child {
        margin-top:0pt;
    }
    .legal {
        margin-top:10pt;
    }
    .fluren {
        height: 200pt;
        overflow-y: scroll;
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
    .fluren abbr a,
    .fluren abbr a:visited {
        color: var(--color-heading);
        text-decoration:none;
    }

    .table-of-contents, .table-of-contents ol {
        list-style-type: none;
    }

    .table-of-contents {
        padding: 7pt 10pt;
        border: 1px solid var(--color-border);
        display: inline-block;
        background-color: var(--color-background-mute)
    }

    .table-of-contents ol {
        padding-inline-start: 2ch;
    }

    .table-of-contents li:first-child::before {
        content:'Inhalt';
        font-weight:bold;
    }

    .table-of-contents li > a {
        text-decoration: none;
        color: var(--color-text);
        display: grid;
        grid-template-columns: auto max-content;
        align-items: end;
    }
</style>
