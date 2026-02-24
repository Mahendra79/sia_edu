import { HiMagnifyingGlass } from "react-icons/hi2";

export default function SearchBar({ value, onChange, placeholder = "Search courses..." }) {
  return (
    <div className="search-bar">
      <HiMagnifyingGlass className="search-icon" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search courses"
      />
    </div>
  );
}
