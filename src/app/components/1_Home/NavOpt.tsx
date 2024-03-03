"use client";

import { faMicrosoft, faNodeJs, faPython } from "@fortawesome/free-brands-svg-icons";
import { faBook, faCode } from "@fortawesome/free-solid-svg-icons";
import { faC } from "@fortawesome/free-solid-svg-icons/faC";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";

export default function NavOpt() {
  return (
    <Autocomplete
      label="Navigation Options :"
      variant="bordered"
      placeholder="Collapsed (default)"
      labelPlacement="inside"
      className="max-w-xs z-50"
    >
      <AutocompleteItem key="Collapsed" textValue="Collapsed">
        <div className="flex gap-2 items-center">
          <FontAwesomeIcon icon={faCode} />
          <div className="flex flex-col">
            <span className="text-small">Collapsed</span>
            <span className="text-tiny text-default-400">
              Everything is Collasped
            </span>
          </div>
        </div>
      </AutocompleteItem>

      <AutocompleteItem key="CSharp" textValue="CSharp">
        <div className="flex gap-2 items-center">
          <FontAwesomeIcon icon={faMicrosoft} />
          <div className="flex flex-col">
            <span className="text-small">C#</span>
            <span className="text-tiny text-default-400">
              Only C# , .NET and Fullstack Experiences
            </span>
          </div>
        </div>
      </AutocompleteItem>

      <AutocompleteItem key="Python" textValue="Python">
        <div className="flex gap-2 items-center">
          <FontAwesomeIcon icon={faPython} />
          <div className="flex flex-col">
            <span className="text-small">Python</span>
            <span className="text-tiny text-default-400">
              Only Python, Data and ML Experiences
            </span>
          </div>
        </div>
      </AutocompleteItem>

      <AutocompleteItem key="Web" textValue="Web">
        <div className="flex gap-2 items-center">
          <FontAwesomeIcon icon={faNodeJs} />
          <div className="flex flex-col">
            <span className="text-small">Web</span>
            <span className="text-tiny text-default-400">
              FullStack web Experiences
            </span>
          </div>
        </div>
      </AutocompleteItem>

      <AutocompleteItem key="All" textValue="All">
        <div className="flex gap-2 items-center">
          <FontAwesomeIcon icon={faBook} />
          <div className="flex flex-col">
            <span className="text-small">All</span>
            <span className="text-tiny text-default-400">
              Good Luck ...
            </span>
          </div>
        </div>
      </AutocompleteItem>
    </Autocomplete>
  );
}
