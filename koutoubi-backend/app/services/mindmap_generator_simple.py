import json
import asyncio
from typing import Dict, Any, List
import logging
import os
from .xmind_loader import XMindLoader

logger = logging.getLogger(__name__)

class MindmapGeneratorSimple:
    def __init__(self):
        self.xmind_loader = XMindLoader()
        self.color_scheme = [
            "#5B69C3",  # Indigo
            "#48B4E0",  # Light Blue
            "#7ED321",  # Green
            "#F5A623",  # Orange
            "#E94B3C",  # Red
            "#9B59B6",  # Purple
            "#1ABC9C",  # Turquoise
            "#34495E"   # Dark Gray
        ]
    
    async def generate_from_pdf(self, pdf_id: str) -> Dict[str, Any]:
        """Generate mindmap from PDF structure - SIMPLIFIED VERSION (2-3 levels max)"""
        try:
            # First, try to load from XMind files
            mindmap_data = self.xmind_loader.load_mindmap_for_pdf(pdf_id)
            
            if mindmap_data:
                logger.info(f"Loaded XMind mindmap for PDF: {pdf_id}")
            else:
                # Fallback to demo if no XMind file exists
                logger.info(f"No XMind file found, using simplified demo for PDF: {pdf_id}")
                mindmap_data = self._create_simple_mindmap(pdf_id)
            
            # Convert to markdown for markmap
            markdown = self._convert_to_markdown(mindmap_data["root"])
            mindmap_data["markdown"] = markdown
            
            return mindmap_data
            
        except Exception as e:
            logger.error(f"Error generating mindmap: {str(e)}")
            raise
    
    def _create_simple_mindmap(self, pdf_id: str) -> Dict[str, Any]:
        """Create a simplified mindmap structure (2-3 levels only like XMind)"""
        return {
            "root": {
                "id": "root",
                "text": "Mohammedou Ould Slahi Case",
                "style": "rounded",
                "children": [
                    {
                        "id": "overview",
                        "text": "Case Overview",
                        "description": "Mauritanian national detained at Guantanamo Bay since 2002. Petitions for habeas corpus after 14 years without charges.",
                        "color": "#5B9BD5",
                        "children": [
                            {
                                "id": "timeline",
                                "text": "Chronologie détaillée des événements",
                                "description": "Novembre 2001: Arrestation en Mauritanie suite à la demande des autorités américaines. Transfert via la Jordanie avec interrogatoires. Août 2002: Arrivée à Guantanamo Bay où il reste détenu sans inculpation. 2004: Première rencontre avec des avocats après la décision Rasul v. Bush. 2009: Audiences d'habeas corpus devant le tribunal fédéral. Mars 2010: Décision du juge Robertson ordonnant sa libération. Octobre 2016: Libération effective après 14 ans de détention sans procès."
                            },
                            {
                                "id": "background",
                                "text": "Parcours personnel et contexte familial",
                                "description": "Né en Mauritanie en 1970 dans une famille modeste. Brillant étudiant, obtient une bourse pour étudier le génie électrique en Allemagne en 1988. Diplômé avec mention, travaille dans plusieurs entreprises technologiques. Séjour à Montréal (1999-2000) pour explorer des opportunités professionnelles. Retour en Mauritanie où il travaille dans l'informatique. Marié, père de famille, sans antécédents criminels. Polyglotte parlant arabe, français, allemand et anglais."
                            }
                        ]
                    },
                    {
                        "id": "allegations",
                        "text": "Government Allegations",
                        "description": "Accused of Al-Qaeda connections spanning decades. Alleged involvement in recruiting and Millennium Plot.",
                        "color": "#ED7D31",
                        "children": [
                            {
                                "id": "connections",
                                "text": "Liens allégués avec Al-Qaeda",
                                "description": "Le gouvernement affirme que Slahi était connecté à Al-Qaeda pendant plusieurs décennies. Son cousin Abu Hafs al-Mauritani était conseiller spirituel de Ben Laden. Formation dans un camp en Afghanistan (1990-1992) pour combattre le régime communiste. Contacts avec la cellule de Montréal impliquée dans le complot du millénaire. Le gouvernement interprète ces liens familiaux et historiques comme preuve d'appartenance active."
                            },
                            {
                                "id": "activities",
                                "text": "Activités terroristes présumées",
                                "description": "Accusations de recrutement de jihadistes en Allemagne et Minneapolis. Développement présumé du réseau de télécommunications d'Al-Qaeda grâce à ses compétences techniques. Hébergement allégué de futurs pirates de l'air du 11 septembre. Transferts financiers suspects totalisant plusieurs milliers de dollars. Envoi d'un fax à un membre d'Al-Qaeda demandant de l'aide logistique. Toutes ces allégations reposent sur des rapports de renseignement contestés."
                            }
                        ]
                    },
                    {
                        "id": "evidence",
                        "text": "Evidence Issues",
                        "description": "Court unable to evaluate reliability due to interrogation methods and redactions.",
                        "color": "#70AD47",
                        "children": [
                            {
                                "id": "coercion",
                                "text": "Déclarations obtenues sous contrainte",
                                "description": "Slahi affirme que ses déclarations incriminantes ont été obtenues sous la torture. Techniques d'interrogatoire 'renforcées' incluant: privation de sommeil pendant des semaines, positions de stress prolongées, températures extrêmes, menaces contre sa mère et sa famille, humiliations sexuelles, faux enlèvement. Un 'plan d'interrogatoire spécial' approuvé en 2003 par Donald Rumsfeld. Le tribunal n'a pu évaluer la fiabilité des déclarations à cause des nombreuses rédactions."
                            },
                            {
                                "id": "reliability",
                                "text": "Problèmes de fiabilité des preuves",
                                "description": "Documents lourdement censurés rendant l'évaluation impossible. Rapports de renseignement d'origine inconnue sans possibilité de vérification. Déclarations contradictoires obtenues à différents moments. Absence de preuves matérielles corroborant les allégations. Témoignages de codétenus eux-mêmes soumis à la torture. Le juge Robertson a conclu que les preuves étaient 'si atténuées ou si viciées par la coercition' qu'elles ne pouvaient être considérées comme fiables."
                            }
                        ]
                    },
                    {
                        "id": "defense",
                        "text": "Slahi's Defense",
                        "description": "Limited involvement ended in 1992. Maintained only social contacts after leaving Afghanistan.",
                        "color": "#FFC000",
                        "children": [
                            {
                                "id": "arguments",
                                "text": "Arguments clés de la défense",
                                "description": "Combat contre les communistes en Afghanistan était légal et soutenu par les États-Unis à l'époque. Le serment (bayat) prêté était limité spécifiquement au combat contre le régime communiste, pas un engagement général envers Al-Qaeda. Aucune implication opérationnelle après 1992, uniquement des contacts sociaux avec d'anciens combattants. Slahi a activement tenté de couper les liens et a refusé de rejoindre Al-Qaeda quand sollicité. Ses voyages avaient des motifs légitimes: études, travail, famille."
                            },
                            {
                                "id": "support",
                                "text": "Éléments favorables à Slahi",
                                "description": "Témoignages de personnalités respectées attestant de son caractère pacifique et de l'absence de vues extrémistes. Historique d'emploi stable en Allemagne et en Mauritanie dans des entreprises légitimes. Engagement communautaire positif, aide aux pauvres et enseignement. Aucune preuve d'activité terroriste pendant les 9 ans entre son retour d'Afghanistan et son arrestation. Coopération initiale avec les autorités lors des premiers interrogatoires. Famille établie et respectée en Mauritanie."
                            }
                        ]
                    },
                    {
                        "id": "legal",
                        "text": "Legal Standards",
                        "description": "Government must prove 'part of' Al-Qaeda at time of capture by preponderance of evidence.",
                        "color": "#7C7C7C",
                        "children": [
                            {
                                "id": "authority",
                                "text": "Base légale de la détention",
                                "description": "L'autorisation d'utilisation de la force militaire (AUMF) de 2001 constitue la base légale invoquée par le gouvernement. L'arrêt Hamdi v. Rumsfeld (2004) a confirmé le pouvoir de détenir des combattants ennemis mais exige une procédure équitable. Boumediene v. Bush (2008) a garanti le droit constitutionnel à l'habeas corpus pour les détenus de Guantanamo. Le gouvernement doit prouver que la détention reste nécessaire et légale selon les lois de la guerre."
                            },
                            {
                                "id": "standard",
                                "text": "Critères juridiques et charge de la preuve",
                                "description": "Le gouvernement porte le fardeau de prouver par prépondérance de preuve que Slahi faisait 'partie' d'Al-Qaeda au moment de sa capture. 'Faire partie' nécessite plus qu'une simple sympathie ou association passée - il faut une appartenance fonctionnelle. Critères: opérer dans la structure de commandement, recevoir et exécuter des ordres, participer aux activités de l'organisation. Le tribunal doit examiner la totalité des circonstances. Les associations datant d'avant 1992 ne suffisent pas sans preuve de continuation."
                            }
                        ]
                    },
                    {
                        "id": "ruling",
                        "text": "Court's Ruling",
                        "description": "Government failed to meet burden. Habeas corpus granted. Slahi must be released.",
                        "color": "#5B9BD5",
                        "children": [
                            {
                                "id": "findings",
                                "text": "Conclusions principales du tribunal",
                                "description": "Le juge Robertson a conclu que le gouvernement n'a pas suffisamment prouvé que Slahi faisait 'partie' d'Al-Qaeda au moment de sa capture. Les connexions avec Al-Qaeda étaient historiques et sociales, pas opérationnelles. Aucune preuve d'appartenance ou de soutien actuel après 1992. Les déclarations obtenues sous coercition ne peuvent être considérées comme fiables. Bien que Slahi ait pu être sympathisant, cela ne suffit pas pour justifier une détention indéfinie. La pétition d'habeas corpus est accordée."
                            },
                            {
                                "id": "impact",
                                "text": "Impact et suites de la décision",
                                "description": "Décision historique établissant des limites à la détention indéfinie sans procès. Renforce l'importance des droits d'habeas corpus même dans le contexte de sécurité nationale. Malgré l'ordre de libération en 2010, Slahi est resté détenu pendant 6 ans supplémentaires à cause des appels du gouvernement. Finalement libéré en octobre 2016 après négociations diplomatiques. A publié ses mémoires 'Journal de Guantánamo' détaillant ses expériences. Son cas reste un symbole des excès de la guerre contre le terrorisme."
                            }
                        ]
                    }
                ]
            },
            "theme": {
                "colorScheme": self.color_scheme,
                "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                "fontSize": 14,
                "nodeSpacing": {
                    "vertical": 60,
                    "horizontal": 200
                },
                "maxDepth": 3  # XMind style - maximum 3 levels
            }
        }
    
    def _convert_to_markdown(self, node: Dict[str, Any], level: int = 0) -> str:
        """Convert mindmap structure to markdown for markmap"""
        indent = "#" * (level + 1)
        markdown = f"{indent} {node['text']}\n"
        
        if "children" in node:
            for child in node["children"]:
                markdown += self._convert_to_markdown(child, level + 1)
        
        return markdown