import json
import asyncio
from typing import Dict, Any, List
import logging
import os
from .xmind_loader import XMindLoader

logger = logging.getLogger(__name__)

class MindmapGenerator:
    def __init__(self):
        self.xmind_loader = XMindLoader()
        self.color_scheme = [
            "#5B69C3",  # Indigo (primary)
            "#48B4E0",  # Light Blue
            "#7ED321",  # Green
            "#F5A623",  # Orange
            "#E94B3C",  # Red
            "#9B59B6",  # Purple
            "#1ABC9C",  # Turquoise
            "#34495E"   # Dark Gray
        ]
        self.branch_colors = {
            "primary": "#5B69C3",
            "secondary": "#48B4E0", 
            "success": "#7ED321",
            "warning": "#F5A623",
            "danger": "#E94B3C",
            "info": "#1ABC9C"
        }
    
    async def generate_from_pdf(self, pdf_id: str) -> Dict[str, Any]:
        """Generate mindmap from PDF structure"""
        try:
            # First, try to load from XMind files
            mindmap_data = self.xmind_loader.load_mindmap_for_pdf(pdf_id)
            
            if mindmap_data:
                logger.info(f"Loaded XMind mindmap for PDF: {pdf_id}")
            else:
                # Fallback to demo if no XMind file exists
                logger.info(f"No XMind file found, using demo for PDF: {pdf_id}")
                mindmap_data = self._create_demo_mindmap(pdf_id)
            
            # Convert to markdown for markmap
            markdown = self._convert_to_markdown(mindmap_data["root"])
            mindmap_data["markdown"] = markdown
            
            return mindmap_data
            
        except Exception as e:
            logger.error(f"Error generating mindmap: {str(e)}")
            raise
    
    def _create_demo_mindmap(self, pdf_id: str) -> Dict[str, Any]:
        """Create a demo mindmap structure"""
        return {
            "root": {
                "id": "root",
                "text": "Mohammedou Ould Slahi Case Summary",
                "color": self.branch_colors["primary"],
                "style": "rounded",
                "children": [
                    {
                        "id": "ch1",
                        "text": "Overview",
                        "page": 17,
                        "color": self.branch_colors["info"],
                        "description": "Slahi has been in custody without charges since November 1, 2001, suspected of involvement in the failed Millennium Plot. The court held hearings on Slahi's petition and the government's response in 2009.",
                        "keywords": ["Legal Proceedings", "Millennium Plot", "Habeas Corpus"],
                        "children": [
                            {
                                "id": "ch1-1",
                                "text": "Case Background",
                                "page": 17,
                                "type": "concept",
                                "description": "Mohammedou Ould Slahi, a Mauritanian national, alleges illegal detention at Guantanamo Bay Naval Base. He petitions for a writ of habeas corpus for his release. This case represents a landmark challenge to indefinite detention policies implemented after September 11, 2001.",
                                "keywords": ["Mauritanian", "Guantanamo", "Habeas"],
                                "children": [
                                    {
                                        "id": "ch1-1-1",
                                        "text": "Personal History",
                                        "description": "Born in Mauritania in 1970, Slahi received an electrical engineering scholarship to study in Germany. His journey through multiple countries would later become central to government allegations."
                                    },
                                    {
                                        "id": "ch1-1-2",
                                        "text": "Initial Detention",
                                        "description": "Arrested in Mauritania in November 2001 at the request of the United States. Transferred through Jordan to Guantanamo Bay in August 2002."
                                    },
                                    {
                                        "id": "ch1-1-3",
                                        "text": "Legal Representation",
                                        "description": "Initially denied access to legal counsel. First met with attorneys in 2004 after the Supreme Court's Rasul v. Bush decision."
                                    }
                                ]
                            },
                            {
                                "id": "ch1-2", 
                                "text": "Legal Proceedings",
                                "page": 20,
                                "type": "definition",
                                "description": "Slahi has been in custody without charges since November 1, 2001, suspected of involvement in the failed Millennium Plot. His case was delayed until the Supreme Court ruled that Guantanamo detainees have the right to habeas proceedings. The complex legal journey spans multiple jurisdictions and raises fundamental questions about due process.",
                                "keywords": ["2001", "Supreme Court", "Millennium Plot"],
                                "children": [
                                    {
                                        "id": "ch1-2-1",
                                        "text": "Millennium Plot Connection",
                                        "description": "Government alleged Slahi recruited Ressam for the failed LAX bombing plot. Evidence primarily consisted of intelligence reports and coerced statements."
                                    },
                                    {
                                        "id": "ch1-2-2",
                                        "text": "Habeas Corpus Filing",
                                        "description": "Original petition filed in 2005. Case stayed pending Boumediene v. Bush Supreme Court decision on detainee rights."
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "id": "ch2",
                        "text": "Evidence Consideration",
                        "page": 45,
                        "color": self.branch_colors["success"],
                        "description": "The court was unable to evaluate the reliability of Slahi's statements due to the condition of redacted information.",
                        "children": [
                            {
                                "id": "ch2-1",
                                "text": "Coerced Statements",
                                "page": 45,
                                "type": "concept",
                                "description": "Slahi claims that many incriminating statements were made under coercion and should be disregarded. The court was unable to evaluate the reliability of Slahi's statements.",
                                "children": [
                                    {
                                        "id": "ch2-1-1",
                                        "text": "Enhanced Interrogation Techniques",
                                        "description": "Court documents reveal use of sleep deprivation, prolonged stress positions, temperature extremes, and threats against family members. These methods were employed during the 'special interrogation plan' approved in 2003."
                                    },
                                    {
                                        "id": "ch2-1-2",
                                        "text": "Redacted Evidence",
                                        "description": "Significant portions of interrogation records were redacted for national security reasons. Court noted inability to fully assess reliability of statements without complete information about interrogation methods."
                                    },
                                    {
                                        "id": "ch2-1-3",
                                        "text": "Legal Implications",
                                        "description": "Defense argues coerced statements violate due process and Geneva Conventions. Government maintains statements were voluntary and interrogation methods were lawful under AUMF authority."
                                    }
                                ]
                            },
                            {
                                "id": "ch2-2",
                                "text": "Timeline of Events",
                                "page": 50,
                                "type": "formula",
                                "description": "A detailed timeline outlines Slahi's activities from 1988 to his capture in 2001, highlighting connections that allegedly link him to Al-Qaida.",
                                "children": [
                                    {
                                        "id": "ch2-2-1",
                                        "text": "1988-1992: Afghanistan Period",
                                        "description": "Traveled to Afghanistan to fight against communist government. Received training at Al-Farouq camp. Swore bayat to Al-Qaeda for limited purpose of fighting communists. Left Afghanistan after fall of communist regime."
                                    },
                                    {
                                        "id": "ch2-2-2",
                                        "text": "1992-1999: Germany and Canada",
                                        "description": "Studied electrical engineering in Germany. Maintained social contacts with former Afghanistan veterans. Brief residence in Montreal (1999-2000). Government alleges recruitment activities during this period."
                                    },
                                    {
                                        "id": "ch2-2-3",
                                        "text": "2000-2001: Return to Mauritania",
                                        "description": "Returned to Mauritania in January 2000. Arrested November 2001 at request of US authorities. Transferred through Jordan to Guantanamo Bay in August 2002. Detained without charges since."
                                    }
                                ]
                            },
                            {
                                "id": "ch2-3",
                                "text": "Recruitment and Support",
                                "page": 55,
                                "type": "example",
                                "description": "The government alleges Slahi provided lodging and rides to individuals later involved in the 9/11 attacks. Evidence includes a fax Slahi sent to an Al-Qaida operative.",
                                "children": [
                                    {
                                        "id": "ch2-3-1",
                                        "text": "Alleged Support Activities",
                                        "description": "Government claims include providing temporary housing to future hijackers, arranging transportation between cities, and facilitating communications. These allegations are based on intelligence reports from multiple sources."
                                    },
                                    {
                                        "id": "ch2-3-2",
                                        "text": "The Fax Evidence",
                                        "description": "A fax sent by Slahi to Abu Hafs al-Mauritani requesting assistance with travel arrangements. Government interprets this as evidence of operational support for terrorist activities."
                                    },
                                    {
                                        "id": "ch2-3-3",
                                        "text": "Contested Interpretations",
                                        "description": "Defense argues these were innocent social interactions common in immigrant communities. Points to lack of direct evidence linking assistance to knowledge of terrorist plans."
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "id": "ch3",
                        "text": "Government's Allegations", 
                        "page": 71,
                        "color": self.branch_colors["warning"],
                        "description": "The government claims Slahi was connected to Al-Qaida for several decades and involved in recruiting individuals for the organization.",
                        "children": [
                            {
                                "id": "ch3-1",
                                "text": "Connection to Al-Qaida",
                                "page": 71,
                                "type": "definition",
                                "description": "The government claims Slahi was connected to Al-Qaida for several decades and involved in recruiting individuals for the organization, including in Minneapolis.",
                                "children": [
                                    {
                                        "id": "ch3-1-1",
                                        "text": "Family Connections",
                                        "description": "Slahi's cousin Abu Hafs al-Mauritani was a senior Al-Qaeda leader and spiritual advisor to Bin Laden. Government argues this relationship provided direct access to Al-Qaeda leadership and operational planning."
                                    },
                                    {
                                        "id": "ch3-1-2",
                                        "text": "Telecommunications Expertise",
                                        "description": "Government alleges Slahi used his electrical engineering background to help develop Al-Qaeda's communication infrastructure. Claims he provided technical assistance for secure communications between cells."
                                    },
                                    {
                                        "id": "ch3-1-3",
                                        "text": "Montreal Cell Activities",
                                        "description": "During 1999-2000 stay in Montreal, government claims Slahi recruited for jihad. Specific allegations include meetings with Ahmed Ressam and other members of the Montreal cell involved in Millennium Plot."
                                    }
                                ]
                            },
                            {
                                "id": "ch3-2",
                                "text": "Allegations include",
                                "page": 80,
                                "type": "example",
                                "description": "Actively supporting his cousin, a spiritual advisor to Osama Bin Laden. Developing Al-Qaida's telecommunications network. Having ties with an Al-Qaida cell in Montreal.",
                                "children": [
                                    {
                                        "id": "ch3-2-1",
                                        "text": "Financial Transfers",
                                        "description": "Government presents evidence of money transfers between Slahi and known Al-Qaeda operatives. Amounts totaling several thousand dollars allegedly used to support terrorist operations."
                                    },
                                    {
                                        "id": "ch3-2-2",
                                        "text": "Safe House Operations",
                                        "description": "Allegations that Slahi's residences in Germany and Canada served as transit points for Al-Qaeda members. Government claims multiple future 9/11 participants stayed at these locations."
                                    },
                                    {
                                        "id": "ch3-2-3",
                                        "text": "Communication Facilitation",
                                        "description": "Evidence of phone calls and faxes between Slahi and Al-Qaeda leadership. Government interprets frequency and timing of communications as evidence of operational involvement."
                                    }
                                ]
                            },
                            {
                                "id": "ch3-3",
                                "text": "Slahi's Defense",
                                "page": 85,
                                "type": "definition",
                                "description": "Slahi's trip to Afghanistan in the early 1990s to fight against communists and his support for the Al-Qaida cause before association ended after 1992. He contends that although he maintained contact with Al-Qaida members, he did not support them after 1992.",
                                "children": [
                                    {
                                        "id": "ch3-3-1",
                                        "text": "Key Defense Arguments",
                                        "description": "1) Fighting in Afghanistan was legal and supported by the US at the time. 2) Bayat (oath) to Al-Qaeda was limited to fighting communists. 3) All contact after 1992 was social, not operational."
                                    },
                                    {
                                        "id": "ch3-3-2",
                                        "text": "Character Witnesses",
                                        "description": "Multiple witnesses testified to Slahi's peaceful character and lack of extremist views. Included former employers and community members from Mauritania and Canada."
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "id": "ch4",
                        "text": "Legal Standards and Burden of Proof",
                        "page": 97,
                        "color": self.branch_colors["danger"],
                        "description": "The government bears the burden of proving that Slahi was part of al-Qaeda at the time of his capture.",
                        "children": [
                            {
                                "id": "ch4-1",
                                "text": "Government's Authority",
                                "page": 97,
                                "type": "concept",
                                "description": "The government's authority to detain Slahi without charges is derived from the Authorization for Use of Military Force (AUMF). The Supreme Court has affirmed the government's power to detain individuals posing a threat to national security.",
                                "children": [
                                    {
                                        "id": "ch4-1-1",
                                        "text": "AUMF Interpretation",
                                        "description": "Government argues AUMF provides broad authority to detain enemy combatants. Includes those who were part of or substantially supported Al-Qaeda, Taliban, or associated forces."
                                    },
                                    {
                                        "id": "ch4-1-2",
                                        "text": "Supreme Court Precedents",
                                        "description": "Hamdi v. Rumsfeld (2004) affirmed detention authority but required due process. Boumediene v. Bush (2008) established constitutional right to habeas corpus for Guantanamo detainees."
                                    },
                                    {
                                        "id": "ch4-1-3",
                                        "text": "Scope of Detention Power",
                                        "description": "Debate over whether AUMF covers individuals captured outside active battlefields. Questions about temporal limits and whether detention authority extends to those with tenuous connections to hostilities."
                                    }
                                ]
                            },
                            {
                                "id": "ch4-2",
                                "text": "Burden of Proof",
                                "page": 105,
                                "type": "formula",
                                "description": "The government bears the burden of proving that Slahi was 'part of' Al-Qaida at the time of his capture. The standard for determining 'part of' an Al-Qaida force includes whether the individual functions under Al-Qaida's command structure.",
                                "children": [
                                    {
                                        "id": "ch4-2-1",
                                        "text": "Legal Standard Definition",
                                        "description": "Court must determine whether individual was 'part of' enemy forces at time of capture. This requires more than mere sympathy or association. Must show functional membership or substantial support."
                                    },
                                    {
                                        "id": "ch4-2-2",
                                        "text": "Evidence Requirements",
                                        "description": "Government must prove case by preponderance of evidence. Court considers totality of circumstances including direct and circumstantial evidence. Intelligence reports given appropriate weight based on reliability."
                                    },
                                    {
                                        "id": "ch4-2-3",
                                        "text": "Command Structure Analysis",
                                        "description": "Key factor is whether individual operated within Al-Qaeda command structure. Court examines evidence of receiving orders, reporting to leaders, and participating in organizational activities."
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "id": "ch5",
                        "text": "Court's Findings",
                        "page": 120,
                        "color": self.branch_colors["primary"],
                        "description": "The court finds that the government has not sufficiently proven that Slahi was 'part of' Al-Qaida at the time of his capture.",
                        "children": [
                            {
                                "id": "ch5-1",
                                "text": "Final Ruling",
                                "page": 120,
                                "type": "concept",
                                "description": "The court finds that the government has not sufficiently proven that Slahi was 'part of' Al-Qaida at the time of his capture. While Slahi may have been an Al-Qaida sympathizer, the evidence does not meet the claim of material support for terrorist activities. The petition for a writ of habeas corpus is granted and Slahi must be released from custody.",
                                "children": [
                                    {
                                        "id": "ch5-1-1",
                                        "text": "Key Findings",
                                        "description": "Court determined Slahi's connections to Al-Qaeda were primarily historical and social rather than operational. Evidence of current membership or support at time of capture was insufficient. Coerced statements undermined government's case."
                                    },
                                    {
                                        "id": "ch5-1-2",
                                        "text": "Legal Reasoning",
                                        "description": "Applied strict interpretation of 'part of' standard. Distinguished between past associations and present membership. Found government failed to establish command structure relationship or operational involvement after 1992."
                                    },
                                    {
                                        "id": "ch5-1-3",
                                        "text": "Remedy Ordered",
                                        "description": "Court granted writ of habeas corpus. Ordered government to take diplomatic steps necessary for Slahi's release. Noted that release does not preclude future criminal prosecution with proper evidence and procedures."
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "id": "ch6",
                        "text": "Conclusion",
                        "page": 130,
                        "color": "#26A69A",
                        "description": "Slahi wins his habeas corpus case.",
                        "children": [
                            {
                                "id": "ch6-1",
                                "text": "Case Significance",
                                "description": "Landmark decision establishing limits on indefinite detention. Reinforces importance of habeas corpus rights even in national security context. Sets precedent for evaluating evidence in detention cases."
                            },
                            {
                                "id": "ch6-2",
                                "text": "Aftermath",
                                "description": "Despite court order, Slahi remained at Guantanamo due to government appeals. Finally released to Mauritania in October 2016 after 14 years detention. Published memoir 'Guantánamo Diary' detailing his experiences."
                            },
                            {
                                "id": "ch6-3",
                                "text": "Broader Implications",
                                "description": "Case highlights tensions between security and civil liberties. Raises questions about reliability of intelligence obtained through coercion. Demonstrates importance of judicial review in executive detention decisions."
                            }
                        ]
                    }
                ]
            },
            "theme": {
                "colorScheme": self.color_scheme,
                "branchColors": self.branch_colors,
                "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                "fontSize": 15,
                "nodeSpacing": {
                    "vertical": 20,
                    "horizontal": 120
                },
                "nodeStyle": {
                    "borderRadius": 8,
                    "padding": "8px 16px",
                    "boxShadow": "0 2px 4px rgba(0,0,0,0.1)"
                },
                "linkStyle": {
                    "stroke": 2,
                    "curve": "bezier"
                }
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