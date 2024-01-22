import React from 'react';
import styles from './Poste.module.css';
import Projet from '../Dev/Projet';

interface PosteProps {
    entreprise: string;
    poste: string;
    date: string;
  children: React.ReactNode;
}

const Poste: React.FC<PosteProps> = ({ entreprise, poste, date, children }) => {
    return (
    <section className=" grid grid-cols-1 sm:grid-cols-12 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit  lg:w-auto  lg:rounded-xl lg:border bg-gray-200 lg:p-4 p-4  mb-5">
        <div>
            <h2 className="text-2xl">{poste}</h2>
            <div className="">{children}</div>
        </div>
        <div className="col-span-5 text-2xl">{date}</div>
        
    </section>
  );
}

export default Poste;
