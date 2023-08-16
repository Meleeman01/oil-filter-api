<script>
    console.log('lol');
    let currentYear = new Date().getFullYear();
    let years = [];
    let selectedYear;
    let selectedMake;
    let selectedModel;
    let selectedEngine;
    let selectedQuery;
    let isLoading = false;
    let makes = [];
    let models = [];
    let engines = [];
    let fuelFilters = [];
    let error;

    let savedQueries = localStorage.previousCars ? JSON.parse(localStorage.getItem('previousCars')):[];

    let query;

    // for (let i = 1990; i <= parseInt(currentYear); i++) {
    //     years.push(i);
    // }
    console.log(years);
    function processFuelFilters(fuelFilters) {
        return fuelFilters.filter((filter)=>{
                if (filter.text.startsWith('Related')) {
                    query = filter.text.substring(filter.text.indexOf(selectedMake.toUpperCase()),filter.text.lastIndexOf('Price'));
                    return filter;
                }
                if (!filter.text.startsWith('\n\nEconomy') && !filter.text.startsWith('Standard Replacement') && !filter.text.startsWith('High Performance')) {
                        console.log(filter);
                        filter.text = filter.text.slice(0,filter.text.lastIndexOf('Info'));
                        return filter;
                    }
            });
    }

    async function getMakes(){
        console.log(selectedYear);
        if (selectedYear.toString().startsWith('--')) {
            return;
        }
        let result = await fetch(`http://localhost:3333/makes?year=${selectedYear}`,{mode:'cors',headers:{
            'Content-Type': 'application/json',
        }});
        makes = await result.json();
    }
    async function getYear() {
        const result = await fetch(`http://localhost:3333/years?make=${encodeURIComponent(selectedMake)}`) 
        years = await result.json();
        console.log(years);
    }

    async function getModel() {
        console.log(selectedMake);
        if (selectedMake.startsWith('--')) {
            return;
        }
        isLoading = true;
        await scrollToBottom();
        let result = await fetch(`http://localhost:3333/models?year=${encodeURIComponent(selectedYear)}&make=${encodeURIComponent(selectedMake)}`);
        models = await result.json();
        if (await result) {
            isLoading = false;
            if (result.err) {
                error = result.err;
            }
            await scrollToBottom();
        }
    }
    async function getEngine() {
        console.log(selectedModel);
        if (selectedMake.startsWith('--')||selectedYear.toString().startsWith('--')||selectedModel.model.startsWith('--')) {
            return;
        }
        isLoading = true;
        await scrollToBottom();
        let result = await fetch(`http://localhost:3333/engines?year=${selectedYear}&make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel.model)}`);
        engines = await result.json();
        if (await result) {
            isLoading = false;
            if (result.err) {
                error = result.err;
            }
            await scrollToBottom();
        }
        if (!engines.length) {
            error = "No engines Found, Try Refreshing.";
        }
        console.log(engines,'engines');
    }
    async function reload() {
        window.location.reload();
    }
    async function scrollToBottom() {
        window.scrollTo({
            top: await document.querySelector('html').scrollHeight +1000,
            left: 0,
            behavior: 'smooth'
        });
    }
    async function submit() {

        isLoading=true;
        await scrollToBottom();
        let result = await fetch(`http://localhost:3333/oilfilters?year=${selectedYear}&make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel.model)}&engine=${encodeURIComponent(selectedEngine)}`);
        fuelFilters = await result.json();
        if (await result) {
            
            isLoading = false;
            console.log(fuelFilters);
            if (fuelFilters.length < 1) {
                error = 'No Filters Found.';
                return;
            }
            else if (fuelFilters.err) {
                error = fuelFilters.err;
                return;
            }

            fuelFilters = processFuelFilters(fuelFilters);
            console.log(fuelFilters);
            //add SuperTech Size for conveniance
            for (let filter of fuelFilters) {
                if (filter.text.startsWith("FRAM")) {
                    fuelFilters.push({text:`SuperTech ST${filter.text.split(' ')[1].split('PH')[1]}`});
                    break;
                }
            }
            //first check if query already searched.
            for (let i of savedQueries) {
                if (i[0].text == fuelFilters[0].text) {
                    return;
                }
            }
            savedQueries.push(fuelFilters);
            localStorage.setItem('previousCars',JSON.stringify(savedQueries));
        }


    }
    function displaySavedData() {
        console.log(selectedQuery);
        query = selectedQuery[0].text.substring(selectedQuery[0].text.indexOf("Parts"),selectedQuery[0].text.lastIndexOf('Price'));
        fuelFilters = selectedQuery;
    }
    async function init() {
        //fetch the makes at the beginning 
        let result = await fetch(`http://localhost:3333/makes`,{mode:'cors',headers:{
            'Content-Type': 'application/json',
        }});


        makes = await result.json();
        console.log(makes);
        if (makes.err) {
           error = makes.err;
        }
    }
    init();
</script>

<div class="flx(wrap) middle center">
    <h1>Oil Filter Api</h1>
    <h2>because walmart pissed me off when they removed their oil filter kiosk, and walmart.com sucks ass.</h2>
</div>
    
<div class="wrapper is-12 flx(wrap,column) center middle">
    {#if !isLoading && fuelFilters.length == 0 || error}

    {#if savedQueries.length}
    <select class="is-3 saved" bind:value={selectedQuery} on:change={displaySavedData}>
        <option class="flx center middle">--Select Previous Vehicle--</option>
        {#each savedQueries as query, q}
            <option on:click={displaySavedData} value="{query}">{query[0].text}</option>
        {/each}
    </select>
    {/if}
    <form class="flx(column) col-center is-3">
        <h3>enter your year, make, model, and engine, and get your oil filter size!</h3>
        
        <div class="is-full flx space-between marginme">
            <label><b>Make:</b></label>
            <select bind:value={selectedMake} on:change={getYear}>
                {#if makes.length}
                    <option>--choose make--</option>
                    {#each makes as make}
                    <option value="{make.text}">{make.text}</option>
                    {/each}
                {/if}
            </select> 
        </div>
        <div class="is-full flx space-between marginme">
            <label><b>Year:</b></label>
            <select bind:value={selectedYear} on:change={getModel}>
                <option>--choose year--</option>
                {#each years as year}
                <option on:click={getMakes} value="{year}">{year}</option>
                {/each}
            </select> 
        </div>
        <div class="is-full flx space-between marginme">
            <label><b>Model:</b></label>
            <select bind:value={selectedModel} on:change={getEngine}>
                {#if models.length}
                    <option>--choose model--</option>
                    {#each models as model}
                        <option value="{model}">{model.model}</option>
                    {/each}
                {/if}
            </select>
        </div>
        {#if engines.length}
        <div class="is-full flx space-between marginme">
            <label><b>Engine</b></label>
            <select bind:value="{selectedEngine}">
                {#each engines as engine}
                    <option value="{JSON.stringify(engine)}">{engine.engine}</option>
                {/each}
            </select>
        </div>
        <div class="is-full flx(wrap) space-evenly marginme">
            <button on:click|preventDefault={submit} class="btn(large) is-primary">Submit</button>
        </div>
        {/if}
        {#if error}
        <span class="is-half" style="color:red; width: 50%; text-align: center;">{error}</span>
        {/if}
    </form>
    {:else if fuelFilters.length}
    <div>
        <div class="flx(wrap) space-between middle padme" style="background-color:#ececec">
            <span>there are {fuelFilters.length -1} fuel filters for your vehicle.</span> 
            <button on:click="{reload}" class="btn(large) is-secondary">Back</button>
        </div>
        
        <p style="border-bottom: solid black 2px;">{query}</p>
        <ul>
            {#each fuelFilters as filter}
            {#if !filter.text.startsWith('Related')}
                <li class="padme">{filter.text}</li>
            {/if}
            {/each}
        </ul>
    </div>
    {:else}
    <img src="giphy.gif" alt="homer running in a circle on the ground">
    <h3>loading...</h3>
    {/if}
    <footer class="flx(wrap) middle center is-full" style=" ">
        <a href="https://ko-fi.com/meleeman"><img class="is-1" style="width:10rem;" src="kofi_button_blue.png"></a>
    </footer>
</div>
    
<style>
    ul > li:nth-child(odd) {
        background-color: #ececec;
    }
    select {
        padding: 1rem;
    }
    .saved {
        width: unset;
    }
    
    @media screen and (max-width: 760px) {
      .saved {
        width: 100%;
      }
    }
</style>