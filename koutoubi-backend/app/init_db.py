from app.core.database import engine, Base, SessionLocal
from app.models import User, Chapter, Flashcard, QuizQuestion
import json
from datetime import datetime
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def init_database():
    """Create SQLite tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ SQLite tables created")


def seed_chapter_11():
    """Add Chapter 11 data with flashcards and quiz"""
    db = SessionLocal()
    
    try:
        # Check if chapter already exists
        existing = db.query(Chapter).filter_by(numero=11).first()
        if existing:
            print("Chapter 11 already exists")
            return
        
        # Create chapter
        chapter = Chapter(
            numero=11,
            title="Proportions et évolutions",
            pdf_path="/pdfs/sesamath_2nde.pdf",
            page_start=291,
            page_end=310,
            niveau="2nde",
            matiere="mathématiques"
        )
        db.add(chapter)
        db.commit()
        
        # Add flashcards
        flashcards_data = [
            # PDF Sésamath (5)
            {
                "type": "définition",
                "question": "Qu'est-ce qu'une proportion ?",
                "answer": "Une proportion est le quotient de l'effectif d'une partie par l'effectif total.",
                "example": "Dans une classe de 30 élèves avec 18 filles, la proportion est 18/30 = 0,6 = 60%",
                "source": "pdf",
                "difficulty": "easy"
            },
            {
                "type": "formule",
                "question": "Comment calculer un pourcentage d'évolution ?",
                "answer": "Pourcentage d'évolution = ((Valeur finale - Valeur initiale) / Valeur initiale) × 100",
                "example": "Prix passant de 50€ à 60€ : ((60-50)/50) × 100 = 20%",
                "source": "pdf",
                "difficulty": "medium"
            },
            {
                "type": "propriété",
                "question": "Quelle est la propriété du coefficient multiplicateur ?",
                "answer": "Coefficient multiplicateur = 1 + taux d'évolution (en décimal)",
                "example": "Pour une hausse de 20%, CM = 1 + 0,20 = 1,20",
                "source": "pdf",
                "difficulty": "medium"
            },
            {
                "type": "méthode",
                "question": "Comment calculer des évolutions successives ?",
                "answer": "On multiplie les coefficients multiplicateurs successifs",
                "example": "+10% puis +20% : CM = 1,10 × 1,20 = 1,32 soit +32%",
                "source": "pdf",
                "difficulty": "hard"
            },
            {
                "type": "définition",
                "question": "Qu'est-ce qu'une évolution réciproque ?",
                "answer": "C'est l'évolution qui permet de revenir à la valeur initiale",
                "example": "Après +25%, l'évolution réciproque est -20% car 1,25 × 0,80 = 1",
                "source": "pdf",
                "difficulty": "hard"
            },
            # Khan Academy (5)
            {
                "type": "concept",
                "question": "Pourquoi une baisse de 50% puis une hausse de 50% ne ramène pas au prix initial ?",
                "answer": "Car les pourcentages s'appliquent sur des valeurs différentes. La hausse s'applique sur la valeur déjà réduite.",
                "example": "100€ → -50% = 50€ → +50% = 75€ (pas 100€)",
                "source": "khan",
                "difficulty": "medium"
            },
            {
                "type": "application",
                "question": "Comment utiliser les proportions en statistiques ?",
                "answer": "Les proportions permettent de comparer des effectifs de populations différentes en les ramenant à une échelle commune.",
                "example": "Comparer le taux de réussite dans deux lycées de tailles différentes",
                "source": "khan",
                "difficulty": "easy"
            },
            {
                "type": "méthode",
                "question": "Comment résoudre un problème de TVA ?",
                "answer": "Prix TTC = Prix HT × (1 + taux TVA). Pour retrouver le HT : Prix HT = Prix TTC / (1 + taux TVA)",
                "example": "Avec TVA 20% : Prix HT 100€ → TTC = 100 × 1,20 = 120€",
                "source": "khan",
                "difficulty": "medium"
            },
            {
                "type": "piège",
                "question": "Quelle erreur éviter avec les pourcentages de pourcentages ?",
                "answer": "Ne pas additionner directement des pourcentages qui ne s'appliquent pas à la même base.",
                "example": "30% des garçons + 40% des filles ≠ 70% de la classe",
                "source": "khan",
                "difficulty": "hard"
            },
            {
                "type": "astuce",
                "question": "Comment vérifier rapidement un calcul de pourcentage ?",
                "answer": "Utiliser des valeurs simples : 10% = diviser par 10, 50% = diviser par 2, 25% = diviser par 4",
                "example": "15% de 200 = 10% + 5% = 20 + 10 = 30",
                "source": "khan",
                "difficulty": "easy"
            },
            # AI enriched (5)
            {
                "type": "analyse",
                "question": "Pourquoi le coefficient multiplicateur est-il plus pratique que le pourcentage pour les calculs ?",
                "answer": "Il permet de faire des multiplications directes au lieu d'additions/soustractions de pourcentages, évitant les erreurs courantes.",
                "example": "Trois hausses de 10% : CM³ = 1,10³ = 1,331 (direct) vs calculer +10% +11% +12,1%",
                "source": "ai",
                "difficulty": "medium"
            },
            {
                "type": "contexte",
                "question": "Comment les proportions sont-elles utilisées en économie ?",
                "answer": "Pour calculer des taux (chômage, inflation, croissance) qui permettent de comparer des périodes ou pays différents.",
                "example": "Taux de chômage = (Nombre de chômeurs / Population active) × 100",
                "source": "ai",
                "difficulty": "medium"
            },
            {
                "type": "stratégie",
                "question": "Quelle stratégie adopter face à un problème complexe d'évolutions ?",
                "answer": "1) Identifier toutes les évolutions 2) Convertir en coefficients multiplicateurs 3) Multiplier 4) Reconvertir en pourcentage final",
                "example": "Soldes -30% puis -20% supplémentaires : CM = 0,70 × 0,80 = 0,56 soit -44% au total",
                "source": "ai",
                "difficulty": "hard"
            },
            {
                "type": "erreur courante",
                "question": "Pourquoi faut-il faire attention aux arrondis dans les calculs de pourcentages ?",
                "answer": "Les arrondis peuvent s'accumuler et fausser significativement le résultat final, surtout avec des calculs en chaîne.",
                "example": "Garder au moins 4 décimales pendant les calculs, arrondir seulement le résultat final",
                "source": "ai",
                "difficulty": "medium"
            },
            {
                "type": "lien interdisciplinaire",
                "question": "Comment les proportions s'appliquent-elles en chimie ?",
                "answer": "Pour calculer les concentrations, les dilutions et les proportions dans les mélanges et réactions chimiques.",
                "example": "Dilution : C₁V₁ = C₂V₂ utilise le principe de conservation des proportions",
                "source": "ai",
                "difficulty": "hard"
            }
        ]
        
        for fc_data in flashcards_data:
            flashcard = Flashcard(chapter_id=chapter.id, **fc_data)
            db.add(flashcard)
        
        # Add quiz questions
        quiz_data = [
            {
                "type": "définition",
                "question": "Une proportion est :",
                "choices": json.dumps([
                    "Le quotient de l'effectif d'une partie par l'effectif total",
                    "La somme de deux effectifs",
                    "Le produit de deux effectifs",
                    "La différence entre deux effectifs"
                ]),
                "correct_answer": 0,
                "explanation": "Une proportion = Partie / Total. Elle représente quelle fraction du tout constitue la partie étudiée.",
                "key_info": json.dumps(["proportion", "quotient", "effectif"]),
                "source": "pdf"
            },
            {
                "type": "calcul",
                "question": "Dans une classe de 25 élèves, 15 sont des filles. Quelle est la proportion de filles ?",
                "choices": json.dumps([
                    "40%",
                    "60%",
                    "15%",
                    "25%"
                ]),
                "correct_answer": 1,
                "explanation": "Proportion = 15/25 = 0,6 = 60%",
                "key_info": json.dumps(["15/25", "60%"]),
                "source": "pdf"
            },
            {
                "type": "formule",
                "question": "Le coefficient multiplicateur pour une hausse de 25% est :",
                "choices": json.dumps([
                    "0,25",
                    "0,75",
                    "1,25",
                    "25"
                ]),
                "correct_answer": 2,
                "explanation": "CM = 1 + taux = 1 + 0,25 = 1,25",
                "key_info": json.dumps(["coefficient multiplicateur", "1 + taux"]),
                "source": "pdf"
            },
            {
                "type": "application",
                "question": "Un prix passe de 80€ à 100€. Le pourcentage d'augmentation est :",
                "choices": json.dumps([
                    "20%",
                    "25%",
                    "80%",
                    "100%"
                ]),
                "correct_answer": 1,
                "explanation": "Évolution = (100-80)/80 × 100 = 20/80 × 100 = 25%",
                "key_info": json.dumps(["(100-80)/80", "25%"]),
                "source": "pdf"
            },
            {
                "type": "évolutions successives",
                "question": "Après une baisse de 20% puis une hausse de 20%, un prix :",
                "choices": json.dumps([
                    "Revient au prix initial",
                    "Est inférieur au prix initial",
                    "Est supérieur au prix initial",
                    "A doublé"
                ]),
                "correct_answer": 1,
                "explanation": "CM = 0,80 × 1,20 = 0,96, donc le prix final est 96% du prix initial (baisse de 4%)",
                "key_info": json.dumps(["0,80 × 1,20", "0,96"]),
                "source": "khan"
            },
            {
                "type": "raisonnement",
                "question": "Si 30% des garçons et 40% des filles portent des lunettes, peut-on dire que 70% de la classe porte des lunettes ?",
                "choices": json.dumps([
                    "Oui, car 30% + 40% = 70%",
                    "Non, car les pourcentages ne s'appliquent pas à la même base",
                    "Oui, si il y a autant de garçons que de filles",
                    "Cela dépend du jour"
                ]),
                "correct_answer": 1,
                "explanation": "Les pourcentages s'appliquent à des groupes différents. Il faut connaître la proportion de garçons et filles dans la classe.",
                "key_info": json.dumps(["base différente", "proportion"]),
                "source": "khan"
            },
            {
                "type": "TVA",
                "question": "Un article coûte 60€ TTC avec une TVA à 20%. Son prix HT est :",
                "choices": json.dumps([
                    "48€",
                    "50€",
                    "52€",
                    "40€"
                ]),
                "correct_answer": 1,
                "explanation": "Prix HT = Prix TTC / (1 + TVA) = 60 / 1,20 = 50€",
                "key_info": json.dumps(["60 / 1,20", "50€"]),
                "source": "khan"
            },
            {
                "type": "calcul mental",
                "question": "15% de 200 équivaut à :",
                "choices": json.dumps([
                    "15",
                    "20",
                    "30",
                    "40"
                ]),
                "correct_answer": 2,
                "explanation": "15% = 10% + 5% = 20 + 10 = 30",
                "key_info": json.dumps(["10% + 5%", "30"]),
                "source": "khan"
            },
            {
                "type": "évolution réciproque",
                "question": "Après une hausse de 25%, quelle baisse permet de revenir au prix initial ?",
                "choices": json.dumps([
                    "25%",
                    "20%",
                    "22,5%",
                    "30%"
                ]),
                "correct_answer": 1,
                "explanation": "Si CM₁ = 1,25, alors CM₂ = 1/1,25 = 0,80, soit une baisse de 20%",
                "key_info": json.dumps(["1/1,25", "20%"]),
                "source": "khan"
            },
            {
                "type": "piège classique",
                "question": "Un magasin augmente ses prix de 10% puis fait une réduction de 10%. Les prix finaux sont :",
                "choices": json.dumps([
                    "Identiques aux prix initiaux",
                    "1% moins chers qu'au départ",
                    "1% plus chers qu'au départ",
                    "10% moins chers qu'au départ"
                ]),
                "correct_answer": 1,
                "explanation": "CM = 1,10 × 0,90 = 0,99, donc baisse de 1%",
                "key_info": json.dumps(["1,10 × 0,90", "0,99"]),
                "source": "ai"
            },
            {
                "type": "analyse",
                "question": "Pour calculer trois hausses successives de 5%, il est plus efficace de :",
                "choices": json.dumps([
                    "Additionner : 5% + 5% + 5% = 15%",
                    "Calculer : 1,05³ = 1,157625",
                    "Faire trois calculs séparés",
                    "Multiplier : 5% × 3 = 15%"
                ]),
                "correct_answer": 1,
                "explanation": "Utiliser le coefficient multiplicateur : 1,05³ = 1,157625, soit environ 15,76% d'augmentation",
                "key_info": json.dumps(["1,05³", "coefficient multiplicateur"]),
                "source": "ai"
            },
            {
                "type": "contexte économique",
                "question": "Un taux d'inflation de 2% signifie que :",
                "choices": json.dumps([
                    "Les prix ont augmenté de 2% en moyenne",
                    "Les salaires ont augmenté de 2%",
                    "L'économie a grandi de 2%",
                    "Le chômage a baissé de 2%"
                ]),
                "correct_answer": 0,
                "explanation": "L'inflation mesure l'augmentation générale des prix sur une période donnée",
                "key_info": json.dumps(["inflation", "augmentation des prix"]),
                "source": "ai"
            },
            {
                "type": "stratégie",
                "question": "Face à des soldes successifs de -30% puis -20%, le mieux est de :",
                "choices": json.dumps([
                    "Additionner : -30% + (-20%) = -50%",
                    "Calculer : 0,70 × 0,80 = 0,56",
                    "Faire la moyenne : -25%",
                    "Prendre le plus grand : -30%"
                ]),
                "correct_answer": 1,
                "explanation": "Multiplier les coefficients : 0,70 × 0,80 = 0,56, soit -44% au total",
                "key_info": json.dumps(["0,70 × 0,80", "-44%"]),
                "source": "ai"
            },
            {
                "type": "précision",
                "question": "Dans les calculs de pourcentages en chaîne, il faut :",
                "choices": json.dumps([
                    "Arrondir à chaque étape",
                    "Garder plusieurs décimales jusqu'au résultat final",
                    "Toujours arrondir à l'entier",
                    "Ne jamais arrondir"
                ]),
                "correct_answer": 1,
                "explanation": "Les arrondis successifs peuvent créer des erreurs importantes. Garder la précision jusqu'à la fin.",
                "key_info": json.dumps(["arrondis", "précision"]),
                "source": "ai"
            },
            {
                "type": "application interdisciplinaire",
                "question": "En chimie, diluer une solution de moitié revient à :",
                "choices": json.dumps([
                    "Diviser la concentration par 2",
                    "Multiplier la concentration par 2",
                    "Ajouter 50% de soluté",
                    "Retirer 50% du solvant"
                ]),
                "correct_answer": 0,
                "explanation": "La dilution conserve la quantité de soluté mais double le volume, donc divise la concentration par 2",
                "key_info": json.dumps(["dilution", "concentration/2"]),
                "source": "ai"
            }
        ]
        
        for q_data in quiz_data:
            question = QuizQuestion(chapter_id=chapter.id, **q_data)
            db.add(question)
        
        # Create a test user
        test_user = User(
            email="test@koutoubi.ai",
            username="test_user",
            hashed_password=pwd_context.hash("password123"),
            full_name="Test User",
            is_active=True,
            role="student"
        )
        db.add(test_user)
        
        db.commit()
        print("✅ Chapter 11 added with flashcards and quiz")
        print("✅ Test user created: test@koutoubi.ai / password123")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
    seed_chapter_11()