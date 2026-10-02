export interface LayerInfo {
    title: string
    paragraphs: string[]
}

const LAYER_INFO: Record<string, LayerInfo> = {
    uraufnahme: {
        title: 'Uraufnahme (1836-1850)',
        paragraphs: [
            'Die Preußische Kartenaufnahme wurde in den Jahren 1836-1850 für die Provinzen Rheinland und Westfalen im Maßstab 1:25.000 angefertigt. Die Karte wird von <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/topographische_karten/historisch/1836/index.html">Geobasis NRW</a> im Onlineverfahren ohne Einschränkungen oder Bedingungen bereitgestellt. Die Karte steht nicht in allen Zoomstufen zur Verfügung.',
        ],
    },
    neuaufnahme: {
        title: 'Neuaufnahme (1891-1912)',
        paragraphs: [
            'Die Preußische Kartenaufnahme wurde als Neuaufnahme in den Jahren 1891-1912 für das gesamten Landesgebiet Preußens im Maßstab 1:25.000 angefertigt. Die Karte wird von <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/topographische_karten/historisch/1891/index.html">Geobasis NRW</a> im Onlineverfahren ohne Einschränkungen oder Bedingungen bereitgestellt. Die Karte steht nicht in allen Zoomstufen zur Verfügung.',
        ],
    },
    'vector-do1914': {
        title: 'Dortmund Zentrum (1914)',
        paragraphs: [
            'Der Layer zeigt einen Ausschnitt des Dortmunder Stadtzentrums um das Jahr 1914 und stellt die damaligen Gebäude, Straßen, Parzellen und Hausnummern dar. Grundlage sind die Inselkarten im Stadtarchiv Dortmund (Best. 200/07-6), die überwiegend aus den Jahren 1907–1913 stammen. Nicht jedes Gebäude ist auf diesen Karten verzeichnet; insbesondere Hof- und Hintergebäude fehlen teilweise. Solche Lücken wurden, soweit möglich, unter Zuhilfenahme späterer Karten geschlossen. Jahre und Hausnummern wurden teils anhand der Gebäudesteuerrollen (Stadtarchiv Dortmund Best. 162/10) ermittelt. Wichtig ist hier anzumerken, dass es sich bei den Jahresangaben in den Gebäudesteuerrollen um ungefähre Baujahre handelt, da hier nur das Jahr erfasst ist, in dem das Gebäude erstmals zur Gebäudesteuer veranlagt wurde (bzw. alle weiteren steuerrelevanten Änderungen).',
            'Einzelne Gebäude lassen sich über die „Untersuchen"-Funktion auswählen, um weitergehende Informationen aus dem Dortmunder Adressbuch von 1914 anzuzeigen. Die Adressbuchdaten wurden überwiegend mittels Texterkennung digitalisiert; einzelne Schreibfehler sind daher möglich. Einträge aus dem Bereich Behörden wurden in der Regel nur erfasst, sofern sie einer konkreten Adresse zugeordnet werden konnten.',
        ],
    },
    'vector-do1610': {
        title: 'Dortmund 1610',
        paragraphs: [
            'Der Layer verortet die bedeutenden Gebäude Dortmunds im Jahr 1610 und ermöglicht den unmittelbaren Vergleich mit der Urkatasterkarte von 1826. Grundlage ist die Karte „Dortmund um 1610" von Heinrich Scholle; die hier gezeigte Darstellung ist jedoch keine unveränderte Wiedergabe dieser Vorlage.',
            'Als Bezugsjahr dient 1610, da aus diesem Jahr die perspektivische Vogelschauansicht Dortmunds von Detmar Mulher überliefert ist. Der Kupferstich gilt als zentrale Quelle zur Topographie der frühneuzeitlichen Stadt, weist jedoch erhebliche Verzerrungen auf. Scholle glich ihn daher mit dem Urkataster von 1826 ab, dessen Straßenführung und Parzellierung im Kern noch mittelalterlich geprägt sind und sich deshalb weitgehend auf den Zustand um 1610 zurückprojizieren lassen. Die bis 1826 abgegangenen Bauten, namentlich Klöster, Kapellen und Teile der Befestigungsanlagen, wurden ergänzt; für deren Lage und für den Verlauf der Stadtbefestigung bleibt der Stich Mulhers die maßgebliche Quelle.',
            'Die Karte samt ausführlicher Dokumentation der Stadtbefestigung, der Kirchen und Klöster, der Straßenfronten und der Wohnhöfe ist veröffentlicht in: „Dortmund im Jahre 1610: Maßstäbliche Rekonstruktion des Stadtbildes" (Dortmund: Verlag des Historischen Vereins Dortmund u. a., 1987). Für eine vertiefte Beschäftigung mit der Stadtgestalt des frühneuzeitlichen Dortmund ist die Lektüre dieses Bandes ausdrücklich empfohlen.',
        ],
    },
}

export function getLayerInfo(id: string): LayerInfo | undefined {
    return LAYER_INFO[id]
}

export function hasLayerInfo(id: string): boolean {
    return id in LAYER_INFO
}
