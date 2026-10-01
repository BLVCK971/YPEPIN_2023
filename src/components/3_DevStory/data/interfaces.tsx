import { IconProp } from "@fortawesome/fontawesome-svg-core"

export interface IPoste {
    icone: IconProp
    texte: string
 }

 export interface ITache {
    icone: IconProp
    texte: string
    soustaches?: ITache[]
 }

 export interface ICollab {
    icone: IconProp
    texte: string
    linkedin? : string
 }

 export interface ITech {
    icone: IconProp
    texte: string
 }

 export interface IMission {
   nom: string
   periode?: string
   // Chiffre ou résultat clé affiché en badge (issu du CV uniquement)
   chiffreCle?: string
   contexte: string
   taches : ITache[]
   resultats?: ITache[]
   techs : ITech[]
   collabs? : ICollab[]
   // Capture illustrant la mission (affichée sous le titre)
   image? : { src: string, alt: string, width: number, height: number }
}

export interface ILogo {
   src: string
   // Logo sombre : affiché sur une pastille claire pour rester lisible
   surFondClair?: boolean
}

export interface ICompany {
   id: string
   nom: string
   dates: string
   contexte?: string
   postes: IPoste[]
   logos: ILogo[]
   missions: IMission[]
}
