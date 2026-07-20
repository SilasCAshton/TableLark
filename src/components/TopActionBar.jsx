import SearchControls from "./SearchControls.jsx"

function TopActionBar (){
    return (
        <section className="TopActionBar">
            <input 
                type="number" 
                placeholder="Search Radius"
                max="25"
                min="1"
            />
            <SearchControls />

        </section>
        
    )
}

export default TopActionBar