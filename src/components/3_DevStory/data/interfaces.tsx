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
   contexte: string
   taches : ITache[]
   techs : ITech[]
   collabs : ICollab[]
}