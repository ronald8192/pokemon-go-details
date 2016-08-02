import pokemongo = require('pokemon-go-api');
import fs = require('fs');
import inquirer = require('inquirer');

class PokemonFetcher{
    username:string;
    password:string;
    accountType:string;
    loc:string = 'Japan';

    constructor(username:string, password:string, accountType:string){
        this.username = username;
        this.password = password;
        this.accountType = accountType;
    }

    download():void{
        pokemongo.login(this.username, this.password, this.accountType)
            .then(function (err) {
                return pokemongo.location.set('address', this.loc)
                    .then(pokemongo.getPlayerEndpoint);
            })
            .then(pokemongo.inventory.get)
            .then(function (inventory) {
                var pokemons:any = [];
                var eggCount:number = 0;
                for(let item of inventory){
                    if(item.inventory_item_data.hasOwnProperty("pokemon_data") && item.inventory_item_data.pokemon_data != null){
                        let data = item.inventory_item_data.pokemon_data;

                        if(data.is_egg == null){
                            pokemons.push({
                                id: data.pokemon_id,
                                cp:data.cp,
                                move_1:data.move_1,
                                move_2:data.move_2,
                                height:this.roundTo(data.height_m, 2),
                                weight:this.roundTo(data.weight_kg, 2),
                                individual_attack:data.individual_attack?data.individual_attack:0,
                                individual_defense:data.individual_defense?data.individual_defense:0,
                                individual_stamina:data.individual_stamina?data.individual_stamina:0,
                                cp_multiplier:this.roundTo(data.cp_multiplier, 4),
                                favorite:data.favorite?true:false,
                                nickname:data.nickname,
                            });
                        }else if(data.is_egg){
                            //may do sth later
                            eggCount++;
                        }
                    }
                }
                console.log(pokemons.length + " Pokemon + " + eggCount + " egg(s) = " + (pokemons.length + eggCount));
                fs.writeFile("./myPokemons.json",
                    JSON.stringify(pokemons),
                    function (err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log("Your Pokemon data was saved to ./myPokemons.json !");
                    }
                );
            })
            .catch(function (error) {
                console.log('error', error.stack);
            });
    }


    private roundTo(value:number, n:number):number {
        var mult = Math.pow(10, n);
        return Math.round(value * mult) / mult;
    }
}

var prompt = inquirer.createPromptModule();
prompt({
    type:'list',
    name:'accountType',
    message:'Account Type: ',
    choices:['Google','Pokémon Trainer Club']
}).then(function (answer) {
    var accountType:string = '';
    var username:string='';
    var password:string='';

    if(answer.accountType == "Google"){
        accountType = 'google';
    }else{
        accountType = 'pokemon-club';
    }

    prompt({
        type:'text',
        name:'username',
        message:accountType=='google'?'Email address: ':'Username: '
    }).then(function (answer) {
        username = answer.username;
        if (accountType == 'google' && username.indexOf('@') < 0)username += '@google.com';
        prompt({
            type:'password',
            name:'password',
            message:'Password: '
        }).then(function (answer) {
            password = answer.password;
            (new PokemonFetcher(username, password, accountType)).download();
        });
    });

});