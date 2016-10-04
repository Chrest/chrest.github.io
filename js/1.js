/* pre-existing vars: config, lang, langs */

var loadData = ['skill', 'translation', 'talent', 'character'],
    data = {},
    character = [ //fixed order
        'CHARACTER_RODERICK',
        'CHARACTER_SCARLETT',
        'CHARACTER_MADORA',
        'CHARACTER_JAHAN',
        'CHARACTER_BAIRDOTR',
        'CHARACTER_WOLGRAFF'
    ],
    attribute = [ //fixed order
        'ATTRIBUTE_STRENGTH',
        'ATTRIBUTE_DEXTERITY',
        'ATTRIBUTE_INTELLIGENCE',
        'ATTRIBUTE_CONSTITUTION',
        'ATTRIBUTE_SPEED',
        'ATTRIBUTE_PERCEPTION'
    ],
    bonus = [ //fixed order
        {name: "NPC_TELLER_OF_SECRETS", tooltip: "TOOLTIP_ATTRIBUTE_BOOK"},
        {name: "NPC_TELLER_OF_SECRETS", tooltip: "TOOLTIP_ABILITY_BOOK"},
        {name: "ITEM_PESTILENTIAL_THOUGHT_CODEX", tooltip: "TOOLTIP_CODEX"},
        {name: "NPC_MOLOCH", tooltip: "TOOLTIP_MOLOCH"},
        {name: "NPC_LAST_CHEST", tooltip: "TOOLTIP_ATTRIBUTE_BOOK"},
        {name: "NPC_LAST_CHEST", tooltip: "TOOLTIP_ABILITY_BOOK"},
        {name: "NPC_IMP", tooltip: "TOOLTIP_ATTRIBUTE_BOOK"}
    ],
    ability = [],
    abilityGroup = [ //fixed order
        "WEAPON",
        "DEFENSE",
        "SKILL",
        "PERSONALITY",
        "CRAFTMANSHIP",
        "NASTY_DEEDS"
    ],
    skill = [],
    skillGroup = [],
    talent = [],
    base64String = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';


function load_data(response) {
    if(response) {
        var key = loadData.shift();
        try {response = JSON.parse(response);}
        catch(e) {document.getElementById('warning').appendChild(createElement('p', {textContent: 'ERROR: Unable to load '+key+' file'}));}
        data[key] = response;
    }
    if(loadData.length) {
        cors('json/' + (loadData[0] == 'translation' ? 'translation.' + lang : loadData[0]) + '.json', 'GET', '', null,
            load_data,
            function() {
                var key = loadData.shift();
                document.getElementById('warning').appendChild(createElement('p', {textContent: 'ERROR: Unable to load '+key+' file'}));
                load_data();
            }
        );
    } else {
        for(var key in data.translation) {
            if(key.substr(0, 6) == 'SKILL_') {
                skill.push(key);
            } else if (key.substr(0, 8) == 'ABILITY_') {
                ability.push(key);
                if(key.substr(0, 14) == 'ABILITY_SKILL_') {
                    skillGroup.push(key.substr(14));
                }
            } else if(key.substr(0, 7) == 'TALENT_') {
                talent.push(key);
            }
            //fixed IDs for hashing.
            skill.sort();
            ability.sort();
            talent.sort();
        }
        translateAll();
        buildView();
    }
}

function translate(key) {
    if(data.translation[key] == undefined) {
        document.getElementById('warning').appendChild(createElement('p', {textContent: 'INVALID TRANSLATION KEY: '+key}));
        return key;
    }
    return data.translation[key];
}
function translateAll() {
    var nodeList = document.querySelectorAll('*[translate]');
    for(var i = 0, iMax = nodeList.length; i < iMax; i++) {
        nodeList[i].textContent = translate(nodeList[i].getAttribute('translate'));
    }
}

function buildView() {
    var bodyNode = document.getElementById('body'),
        view = [
            'character',
            'skill',
            'attribute',
            'ability',
            'talent',
            'bonus',
            'result'
        ];
    bodyNode.textContent = '';
    
    for(var i = 0, iMax = view.length; i < iMax; i++) {
        bodyNode.appendChild(
            createElement('input', {type: 'radio', className: 'toggler hidden', name: 'window', id: view[i] + '_toggler'})
        );
        bodyNode.appendChild(build[view[i]]());
        build[view[i]] = null; //we don't need it anymore.
    }
    // toggle last view (results).
    document.getElementById(view[view.length-1] + '_toggler').checked = true;
    
    hashToConfig();
    
    document.querySelector('[for=result_toggler]').onclick = compile;
    document.querySelector('[for=result_toggler]').click();
}

var click_action = {
    dispatch: function(e) {
        if(e.target.className && click_action[e.target.className] != undefined) {
            click_action[e.target.className](e.target);
            order_rank(e.currentTarget.id);
        }
    },
    move_up: function(e) {
        if(e.parentNode.previousSibling) {
            e.parentNode.parentNode.insertBefore(e.parentNode, e.parentNode.previousSibling);
        }
    },
    move_down: function(e) {
        if(e.parentNode.nextSibling) {
            e.parentNode.parentNode.insertBefore(e.parentNode, e.parentNode.nextSibling.nextSibling);
        }
    },
    add: function(e, node) {
        var type = ['attribute', 'ability', 'talent'],
            index = -1,
            limit = 1,
            extension = 'png',
            dataList = null;
        while(type.indexOf(e.id) == -1 && e.parentNode) {
            if(index == -1 && e.data_index != undefined) {
                index = e.data_index;
            }
            e = e.parentNode;
        }
        if(type.indexOf(e.id) == -1) {
            return false;
        }
        type = e.id;
        switch(type) {
            case 'attribute':
            limit = 10;
            dataList = attribute;
            extension = 'jpg';
            break;
            case 'ability':
            limit = 5;
            dataList = ability;
            break;
            case 'talent':
            dataList = talent;
            break;
        }
        var listNode = document.getElementById(type + '_list');
        if(listNode.querySelectorAll('*[translate='+dataList[index]+']').length +
            document.getElementById(type + '_forced').querySelectorAll('*[translate='+dataList[index]+']').length < limit) {
            listNode.insertBefore(
                createElement('li', {data_index: index},
                    createElement('img', {className: (type == 'talent' ? '':'duplicate'), src: 'icon/'+dataList[index]+'.'+extension}),
                    createElement('span', {className: (type == 'talent' ? '':'duplicate'), translate: dataList[index], textContent: translate(dataList[index])}),
                    createElement('span', {className: 'move_up', textContent: '▲'}),
                    createElement('span', {className: 'move_down', textContent: '▼'}),
                    createElement('span', {className: 'remove', textContent: 'x'})
                ),
                node
            );
        }
    },
    duplicate: function(e) {
        click_action.add(e, e.parentNode);
    },
    remove: function(e) {
        e.parentNode.parentNode.removeChild(e.parentNode);
    }
}

var build = { //function array

    character: function() {
        var characterNode = createElement('div', {id: 'character', className: 'toggable'},
            createElement('div', {className: 'col'},
                createElement('h2', {className: 'LAYOUT_CHARACTER_SELECTION', textContent: translate('LAYOUT_CHARACTER_SELECTION')})
            )
        );
        
        for(var i = 0, iMax = character.length; i < iMax; i++) {
            characterNode.firstChild.appendChild(createElement('input', {type: 'radio', className: 'hidden', name: 'character', id: character[i], value: i}));
            characterNode.firstChild.appendChild(createElement('label', {className: 'icon', htmlFor: character[i], onclick: load_character},
                    createElement('img', {src: 'icon/'+character[i]+'.png'}),
                    createElement('span', {translate: character[i], textContent: translate(character[i])})
            ));
        }
        
        return characterNode;
    },
    
    bonus: function() {
        var bonusNode = createElement('div', {id: 'bonus', className: 'toggable'},
            createElement('div', {className: 'col'},
                createElement('h2', {translate: 'LAYOUT_BONUS_SELECTION', textContent: translate('LAYOUT_BONUS_SELECTION')})
            )
        );
        
        for(var i = 0, iMax = bonus.length; i< iMax; i++) {
            bonusNode.firstChild.appendChild(createElement('div', {},
                createElement('div', {className: 'icon'},
                    createElement('img', {src: 'icon/'+bonus[i].name+'.png'}),
                    createElement('span', {translate: bonus[i].name, textContent: translate(bonus[i].name)})
                ),
                createElement('div', {className: 'range'},
                    createElement('span', {translate: bonus[i].tooltip, textContent: translate(bonus[i].tooltip)}),
                    createElement('input', {type: 'number', min: 0, max: 31, value: 0})
                )
            ));
        }
        
        return bonusNode;
    },
    
    skill: function() {
        var skillNode = createElement('div', {id: 'skill', className: 'toggable'},
                createElement('div', {className: 'col'},
                    createElement('h2', {translate: 'LAYOUT_SKILL_HIGHLIGHTER', textContent: translate('LAYOUT_SKILL_HIGHLIGHTER')})
                )),
            groupNode = createElement('div', {className: 'col'}),
            skillList = {},
            jMax = skillGroup.length,
            skillType = ["","NOVICE","ADEPT","","MASTER"];
        
        for(var i = 0, iMax = skill.length; i < iMax; i++) {
            for(var j = 0; j < jMax; j++) {
                var groupName = 'SKILL_' + skillGroup[j];
                if(skill[i].substr(0, groupName.length) == groupName) {
                    if(!skillList['ABILITY_' + groupName]) {
                        skillList['ABILITY_' + groupName] = [];
                    }
                    skillList['ABILITY_' + groupName].push(skill[i]);
                    j = jMax;
                }
            }
        }

        for(var school in skillList) {
            var skillListNode = createElement('div', {className: 'toggable'});
            skillList[school].sort( sortSkill );

            for(var i = 0, jMax = skillList[school].length; i < jMax; i++) {

                skillListNode.appendChild(createElement('input', {type: 'checkbox', className: 'toggler hidden', name: 'skill[]', id: skillList[school][i], value: skill.indexOf(skillList[school][i])}));
                
                var type = skillType[data.skill[skillList[school][i]][1]];
                
                skillListNode.appendChild(createElement('label', {htmlFor: skillList[school][i]},
                    createElement('img', {src: 'icon/'+skillList[school][i]+'.png'}),
                    createElement('span', {className: 'tooltip'},
                        createElement('span', {className: 'spell_type'},
                            createElement('span', {translate: type, textContent: translate(type)}),
                            createElement('span', {textContent: ' (' + data.skill[skillList[school][i]][2] + ')'})
                        ),

                        createElement('span', {className: 'spell_name', translate: skillList[school][i], textContent: translate(skillList[school][i])}),

                        createElement('span', {className: 'spell_level'},
                            createElement('span', {translate: 'LEVEL_REQUIRED', textContent: translate('LEVEL_REQUIRED')}),
                            createElement('span', {textContent: data.skill[skillList[school][i]][0]})
                        ),

                        createElement('span', {className: 'spell_attribute'},
                            createElement('span', {translate: 'RECOMMENDED_ATTRIBUTE', textContent: translate('RECOMMENDED_ATTRIBUTE')}),
                            createElement('span', {textContent: data.skill[skillList[school][i]][3]})
                        )
                    )
                ));
            }
            skillNode.firstChild.appendChild(createElement('label', {htmlFor: 'toggle_' + school, className: 'icon'},
                    createElement('img', {src: 'icon/'+school+'.png'}),
                    createElement('span', {translate: school, textContent: translate(school)})
            ));
            groupNode.appendChild(createElement('input', {type: 'checkbox', className: 'hidden toggler', name: 'highlighter', id: 'toggle_' + school, onclick: unique_toggle}));
            groupNode.appendChild(skillListNode);
        }
        skillNode.appendChild(groupNode);
        return skillNode;
    },
    
    attribute: function() {
        var attributeNode = createElement('div', {id: 'attribute', className: 'toggable', onclick: click_action.dispatch},
            createElement('div', {className: 'col'},
                createElement('h2', {translate: 'LAYOUT_ATTRIBUTE_LIST', textContent: translate('LAYOUT_ATTRIBUTE_LIST')}),
                createElement('ul', {id: 'attribute_forced'}),
                createElement('ul', {id: 'attribute_list'})
            ),
            createElement('div', {className: 'col'},
                createElement('h2', {translate: 'LAYOUT_ATTRIBUTE_PICKER', textContent: translate('LAYOUT_ATTRIBUTE_PICKER')})
            )
        );
        for(var i = 0, iMax = attribute.length; i < iMax; i++) {
            attributeNode.lastChild.appendChild(createElement('div', {className: 'small_icon', data_index: i},
                createElement('img', {className: 'add', src: 'icon/'+attribute[i]+'.jpg'}),
                createElement('span', {className: 'add', translate: attribute[i], textContent: translate(attribute[i])})
            ));
        }

        return attributeNode;
    },
    
    ability: function() {
        var abilityNode = createElement('div', {id: 'ability', className: 'toggable', onclick: click_action.dispatch},
            createElement('div', {className: 'col'},
                createElement('h2', {translate: 'LAYOUT_ABILITY_LIST', textContent: translate('LAYOUT_ABILITY_LIST')}),
                createElement('ul', {id: 'ability_forced'}),
                createElement('ul', {id: 'ability_list'})
            ),
            createElement('div', {className: 'col'},
                createElement('h2', {translate: 'LAYOUT_ABILITY_PICKER', textContent: translate('LAYOUT_ABILITY_PICKER')})
            )),
            abilityList = {},
            jMax = abilityGroup.length;

        for(var i = 0, iMax = ability.length; i < iMax; i++) {
            for(var j = 0; j < jMax; j++) {
                var groupName = 'ABILITY_' + abilityGroup[j];

                if(ability[i].substr(0, groupName.length) == groupName) {
                    if(!abilityList['GROUP_' + abilityGroup[j]]) {
                        abilityList['GROUP_' + abilityGroup[j]] = [];
                    }
                    abilityList['GROUP_' + abilityGroup[j]].push(ability[i]);
                    j = jMax;
                }
            }
        }
        
        for(var i = 0, iMax = abilityGroup.length; i < iMax; i++) {
            abilityNode.lastChild.appendChild(createElement('h4', {translate: 'GROUP_' + abilityGroup[i], textContent: translate('GROUP_' + abilityGroup[i])}));
            for(var j = 0, jMax = abilityList['GROUP_' + abilityGroup[i]].length; j < jMax; j++) {
                abilityNode.lastChild.appendChild(createElement('div', {className: 'small_icon', data_index: ability.indexOf(abilityList['GROUP_' + abilityGroup[i]][j])},
                    createElement('img', {className: 'add', src: 'icon/'+abilityList['GROUP_' + abilityGroup[i]][j]+'.png'}),
                    createElement('span', {className: 'add', translate: abilityList['GROUP_' + abilityGroup[i]][j], textContent: translate(abilityList['GROUP_' + abilityGroup[i]][j])})
                ));
            }
        }

        return abilityNode;
    },
    
    talent: function() {
        var talentNode = createElement('div', {id: 'talent', className: 'toggable', onclick: click_action.dispatch},
            createElement('div', {className: 'col'},
                createElement('h2', {translate: 'LAYOUT_TALENT_LIST', textContent: translate('LAYOUT_TALENT_LIST')}),
                createElement('ul', {id: 'talent_forced'}),
                createElement('ul', {id: 'talent_list'})
            ),
            createElement('div', {className: 'col'},
                createElement('h2', {translate: 'LAYOUT_TALENT_PICKER', textContent: translate('LAYOUT_TALENT_PICKER')})
            )
        );
            
        for(var i = 0, iMax = talent.length; i< iMax; i++) {
            talentNode.lastChild.appendChild(createElement('div', {className: 'small_icon', data_index: i},
                    createElement('img', {className: 'add', src: 'icon/'+talent[i]+'.png'}),
                    createElement('span', {className: 'add', translate: talent[i], textContent: translate(talent[i])})
            ));
        }
        
        return talentNode;
    },
    
    result: function() {
        var resultNode = createElement('div', {className: 'toggable', id: 'result'},
            createElement('div', {className: 'col'},
                createElement('h2', {translate: 'LAYOUT_RESULT', textContent: translate('LAYOUT_RESULT')})
            )
        );
        return resultNode;
    }    
};

function load_character() {
    var character_name = this.htmlFor,
        checkData = ['attribute', 'ability', 'talent'];
    document.getElementById(character_name).click();
    for(var i = 0, iMax = checkData.length; i < iMax; i++) {
        var forcedNode = document.getElementById(checkData[i] + '_forced');
        forcedNode.textContent = '';
        if(data.character[character_name][checkData[i]].length > 1) {
            var dataList, extension;
            switch(checkData[i]) {
                case 'attribute':
                dataList = attribute;
                extension = 'jpg';
                break;
                case 'ability':
                dataList = ability;
                extension = 'png';
                break;
                case 'talent':
                dataList = talent;
                extension = 'png';
                break;
                default:
                break;
            }
            for(var j = 1, jMax = data.character[character_name][checkData[i]].length; j < jMax; j++) {
                var full_name = checkData[i].toUpperCase() + '_' + data.character[character_name][checkData[i]][j];
                forcedNode.appendChild(
                    createElement('li', {data_index: dataList.indexOf(full_name), data_type: checkData[i]},
                        createElement('span', {className: 'lock', textContent: '🔒'}),
                        createElement('img', {src: 'icon/'+full_name+'.'+extension}),
                        createElement('span', {translate: full_name, textContent: translate(full_name)})
                    )
                );
            }
        }
        document.getElementById(checkData[i] + '_list').textContent = '';
        order_rank(checkData[i]);
    }
}

function sortSkill(a, b) {
    var pointerOrder = [1, 0, 2, 3];
    for(var i = 0, iMax = pointerOrder.length; i < iMax; i++) {
        if(data.skill[a][pointerOrder[i]] > data.skill[b][pointerOrder[i]]) return 1;
        if(data.skill[a][pointerOrder[i]] < data.skill[b][pointerOrder[i]]) return -1;
    }
    return 0;
}

function unique_toggle() { // for the skill highlighter list to have a "none" choice (can't do it with radio?).
    var resetNodes = document.querySelectorAll('input[name="'+this.name+'"]:checked');
    for(var i = 0, iMax = resetNodes.length; i < iMax; i++) {
        if(resetNodes[i] != this) resetNodes[i].checked = false;
    }
}

function order_rank(type) {
    if(type == 'talent') {
        return true;
    }
    var nodeList = document.querySelectorAll('#' + type + ' li img + span'),
        counter = {};
    for(var i = 0, iMax = nodeList.length; i < iMax; i++) {
        var key = nodeList.item(i).getAttribute('translate');
        if(!counter[key]) {
            counter[key] = 0;
        }
        counter[key]++;
        nodeList.item(i).setAttribute('data-rank', counter[key]);
    }
}

function configToHash() {
    var hash = 'v' + version + '-' + lang;
    
    var inputData = {
        character: document.querySelector('#character input:checked'),
        skill: document.querySelectorAll('#skill .toggable input:checked'),
        attribute: document.querySelectorAll('#attribute_list img + span'),
        ability: document.querySelectorAll('#ability_list img + span'),
        talent: document.querySelectorAll('#talent_list img + span'),
        bonus: document.querySelectorAll('#bonus input')
    };
    
    hash += inputData.character ? ';c' + inputData.character.value : '';
    
    if(inputData.skill.length) { //16 x 8 skills. 128.
        var skill_array = {s: [], k: []},
            skill_pointer = 0;
        for(var i = 0, iMax = inputData.skill.length; i < iMax; i++) {
            skill_pointer = parseInt(inputData.skill[i].value, 10);
            if(skill_pointer < 64) {
                skill_array.s.push(skill_pointer);
            } else {
                skill_array.k.push(skill_pointer - 64);
            }
        }
        for(var key in skill_array) {
            if(skill_array[key].length) {
                hash += ';' + key;
                for(var i = 0, iMax = skill_array[key].length; i < iMax; i++) {
                    hash += base64String[skill_array[key][i]];
                }
            }
        }
    }
    
    if(inputData.attribute.length) {
        hash += ';a';
        for(var i = 0, iMax = inputData.attribute.length; i < iMax; i++) {
            hash += base64String[attribute.indexOf(inputData.attribute[i].getAttribute('translate'))];
        }
    }
    
    if(inputData.ability.length) {
        hash += ';i';
        for(var i = 0, iMax = inputData.ability.length; i < iMax; i++) {
            hash += base64String[ability.indexOf(inputData.ability[i].getAttribute('translate'))];
        }
    }
    
    if(inputData.talent.length) { //less than 64 talents
        hash += ';t';
        for(var i = 0, iMax = inputData.talent.length; i < iMax; i++) {
            hash += base64String[talent.indexOf(inputData.talent[i].getAttribute('translate'))];
        }
    }
    
    if(inputData.bonus.length) {
        hash += ';b';
        for(var i = 0, iMax = inputData.bonus.length; i < iMax; i++) {
            hash += base64String[inputData.bonus[i].value];
        }
    }
    
    window.location.hash = '#' + hash;
}

function hashToConfig() {
    if(config) {
        var selector = {
                a: ['#attribute .small_icon', attribute],
                i: ['#ability .small_icon', ability],
                t: ['#talent .small_icon', talent]
        };
        for(var i = 0, iMax = config.length; i < iMax; i++) {
            if(config[i].length > 1) {
                switch(config[i][0]) {
                    case 'c':
                        if(parseInt(config[i][1], 10) < character.length) {
                            document.querySelector('label[for='+character[parseInt(config[i][1], 10)]+']').click();
                        }
                    break;
                    case 's':
                    case 'k':
                        var adding = config[i][0] == 'k' ? 64 : 0;
                        for(var j = 1, jMax = config[i].length; j < jMax; j++) {
                            if(base64String.indexOf(config[i][j]) > -1) {
                                document.getElementById(skill[base64String.indexOf(config[i][j]) +adding]).checked = true;
                            }
                        }
                    break;
                    case 'a':
                    case 'i':
                    case 't':
                        for(var j = 1, jMax = config[i].length; j < jMax; j++) {
                            var number = base64String.indexOf(config[i][j]);
                            if(number > -1 && number < selector[config[i][0]][1].length) {
                                document.querySelector(selector[config[i][0]][0] + ' *[translate=' + selector[config[i][0]][1][number]+']').click();
                            }
                        }
                    break;
                    case 'b':
                        var nodes = document.querySelectorAll('#bonus input');
                        for(var j = 1, jMax = Math.min(config[i].length, nodes.length+1); j < jMax; j++) {
                             var number = parseInt(base64String.indexOf(config[i][j]), 10);
                            if(number > -1 && number < 32) {
                                nodes.item(j -1).value = number;
                            }
                        }
                    break;
                    default:
                }
            }
        }
    }
}

//test #v1-en;c0;sqskihn;kcJLV_;a111441120120144;ingml0ng122agn577jgjgj;tKAwgb65;b779bggh
function compile() {
    document.getElementById(this.htmlFor).click();
    var resultNode = document.getElementById('result').firstChild;
    while(resultNode.firstChild.nextSibling) { //empty result node
        resultNode.removeChild(resultNode.firstChild.nextSibling);
    }

    configToHash();
    
    var inputData = {
        character: document.querySelector('#character input:checked'),
        skill: document.querySelectorAll('#skill .toggable input:checked'),
        attribute: document.querySelectorAll('#attribute ul img + span'),
        ability: document.querySelectorAll('#ability ul img + span'),
        talent: document.querySelectorAll('#talent ul img + span'),
        bonus: document.querySelectorAll('#bonus input')
    };
    
    inputData.character = inputData.character ? inputData.character.value : 0;
    
    var pointerChar = data.character[character[inputData.character]];
    var stock = {
            attribute: pointerChar.attribute[0],
            ability: pointerChar.ability[0],
            talent: pointerChar.talent[0],
            skill: {INTELLIGENCE: [], DEXTERITY: [], STRENGTH: []}
        },
        level = 1,
        current = {
            attribute: 0,
            ability: 0,
            talent: 0
        },
        stats = {
            STRENGTH: 5, DEXTERITY: 5, INTELLIGENCE: 5, CONSTITUTION: 5, SPEED: 5, PERCEPTION: 5
        },
        lonewolf = false;
    
    for(var i =0, iMax = inputData.skill.length; i < iMax; i++) {
        var skill_name = inputData.skill[i].id;
        if(skill_name.substr(0, 7) == 'SKILL_S' || skill_name.substr(0, 7) == 'SKILL_E') { //expert marksman or scoundrel
            stock.skill.DEXTERITY.push({name: skill_name, watch : false, just_added: true});
        } else if(skill_name.substr(0, 7) == 'SKILL_M') { //man at arms
            stock.skill.STRENGTH.push({name: skill_name, watch : false, just_added: true});
        } else { //int based
            stock.skill.INTELLIGENCE.push({name: skill_name, watch : false, just_added: true});
        }
    }
    inputData.skill = null;

    while(level < 30) {
        
        var output = {
            demonTradeAbility: 0,
            demonTradeAttribute: 0,
            attribute: {},
            ability: [],
            talent: [],
            bonus: [],
            skill: []
        };

        if(level == inputData.bonus.item(0).value) {
            stock.attribute++;
            output.bonus[0] = true;
        }
        if(level == inputData.bonus.item(1).value) {
            stock.ability += 3;
            output.bonus[1] = true;
        }
        if(level == inputData.bonus.item(2).value) {
            stats.INTELLIGENCE++;
            stats.PERCEPTION--;
            output.bonus[2] = true;
        }
        if(level == inputData.bonus.item(4).value) {
            stock.attribute++;
            output.bonus[4] = true;
        }
        if(level == inputData.bonus.item(5).value) {
            stock.ability += 3;
            output.bonus[5] = true;
        }
        if(level == inputData.bonus.item(6).value) {
            stock.attribute++;
            output.bonus[6] = true;
        }
        
        while(stock.talent && current.talent < inputData.talent.length) {
            output.talent.push(inputData.talent.item(current.talent).getAttribute('translate'));
            if(inputData.talent.item(current.talent).getAttribute('translate') == 'TALENT_LONE_WOLF') {
                lonewolf = true;
            } else if(inputData.talent.item(current.talent).getAttribute('translate') == 'TALENT_ALL_SKILLED_UP') {
                stock.ability += 2;
            } else if(inputData.talent.item(current.talent).getAttribute('translate') == 'TALENT_BIGGER_BETTER') {
                stock.attribute += 1;
            } else if(inputData.talent.item(current.talent).getAttribute('translate') == 'TALENT_KNOW_IT_ALL') {
                stats.INTELLIGENCE++;
                output.attribute.INTELLIGENCE = 0;
            }
            current.talent++;
            stock.talent--;
        }
        
        if(level >= inputData.bonus.item(3).value && inputData.bonus.item(3).value != 0) {//demon trade
                if(stock.talent && current.talent == inputData.talent.length) {
                    output.demonTradeAbility += stock.talent;
                    stock.ability += stock.talent;
                    stock.talent = 0;
                }
                if(stock.ability && stock.ability > 2 && current.ability == inputData.ability.length) {
                    output.demonTradeAttribute += Math.floor(stock.ability / 3);
                    stock.attribute += output.demonTradeAttribute;
                    stock.ability = stock.ability % 3;
                }
        }
        
        while(stock.attribute && current.attribute < inputData.attribute.length) {
            var attribute_name = inputData.attribute.item(current.attribute).getAttribute('translate').substr(10);
            stats[attribute_name]++;
            stock.attribute--;
            
            if(output.attribute[attribute_name] === undefined) {
                output.attribute[attribute_name] = 1;
            } else {
                output.attribute[attribute_name]++;
            }
            current.attribute++;
        }
        
        while(stock.ability && current.ability < inputData.ability.length && stock.ability >= parseInt(inputData.ability.item(current.ability).getAttribute('data-rank'), 10)) {
            var ability_rank = inputData.ability.item(current.ability).getAttribute('data-rank');
            output.ability.push({name: inputData.ability.item(current.ability).getAttribute('translate'), rank: ability_rank});
            if(inputData.ability.item(current.ability).getAttribute('translate').substr(8, 5) == 'SKILL') {
                for(var key in stock.skill) {
                    for(var i = 0, iMax = stock.skill[key].length; i < iMax; i++) {
                        if(!stock.skill[key][i].watch) {
                            var ability_school = inputData.ability.item(current.ability).getAttribute('translate').substr(8);
                            if(stock.skill[key][i].name.substr(0, ability_school.length) == ability_school) {
                                var skill_name = stock.skill[key][i].name;
                                if(ability_rank >= data.skill[skill_name][1]) {
                                    stock.skill[key][i].watch = true;
                                }
                            }
                        }
                    }
                }
                
            }
            stock.ability -= parseInt(ability_rank, 10);
            current.ability++;
        }
        
        for(var key in stock.skill) {
            for(var i = 0, iMax = stock.skill[key].length; i < iMax; i++) {
                var skill_name = stock.skill[key][i].name;
                if(stock.skill[key][i].watch && level >= data.skill[skill_name][0]) {
                    if((data.skill[skill_name][3] != 0 && output.attribute[key] !== undefined) || stock.skill[key][i].just_added == true) {
                        stock.skill[key][i].just_added = false;
                        output.skill.push(stock.skill[key][i].name);
                    }
                }
            }
        }

        //output analysis
        if(output.bonus.length || output.demonTradeAbility || output.demonTradeAttribute) {
            var tempNode = createElement('div', {className: 'row bonus'});
            
            if(output.bonus[0] != null) {
                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+bonus[0].name+'.png'}),
                    createElement('span', {translate: bonus[0].tooltip, textContent: translate(bonus[0].tooltip)})
                ));
            }
            if(output.bonus[1] != null) {
                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+bonus[1].name+'.png'}),
                    createElement('span', {translate: bonus[1].tooltip, textContent: translate(bonus[1].tooltip)})
                ));
            }
            if(output.bonus[2] != null) {
                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+bonus[2].name+'.png'}),
                    createElement('span', {translate: bonus[2].tooltip, textContent: translate(bonus[2].tooltip)})
                ));
            }
            if(output.demonTradeAbility) {
                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+bonus[3].name+'.png'}),
                        createElement('span', {textContent: ' ' + output.demonTradeAbility + 'x'}),
                        createElement('span', {translate: 'LAYOUT_TALENT_PANEL', textContent: translate('LAYOUT_TALENT_PANEL')}),
                        createElement('span', {textContent: ' -> ' + output.demonTradeAbility + 'x'}),
                        createElement('span', {translate: 'LAYOUT_ABILITY_PANEL', textContent: translate('LAYOUT_ABILITY_PANEL')})
                ));
            }
            if(output.demonTradeAttribute) {
                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+bonus[3].name+'.png'}),
                        createElement('span', {textContent: ' ' + 3*output.demonTradeAttribute + 'x '}),
                        createElement('span', {translate: 'LAYOUT_ABILITY_PANEL', textContent: translate('LAYOUT_ABILITY_PANEL')}),
                        createElement('span', {textContent: ' -> ' + output.demonTradeAttribute + 'x '}),
                        createElement('span', {translate: 'LAYOUT_ATTRIBUTE_PANEL', textContent: translate('LAYOUT_ATTRIBUTE_PANEL')})
                ));
            }
            if(output.bonus[4] != null) {
                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+bonus[4].name+'.png'}),
                    createElement('span', {translate: bonus[4].tooltip, textContent: translate(bonus[4].tooltip)})
                ));
            }
            if(output.bonus[5] != null) {
                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+bonus[5].name+'.png'}),
                    createElement('span', {translate: bonus[5].tooltip, textContent: translate(bonus[5].tooltip)})
                ));
            }
            if(output.bonus[6] != null) {
                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+bonus[6].name+'.png'}),
                    createElement('span', {translate: bonus[6].tooltip, textContent: translate(bonus[6].tooltip)})
                ));
            }
            resultNode.appendChild(tempNode);
        }
        
        var tempNode = createElement('div', {className: 'row attribute'});
        for(var key in output.attribute) {
            tempNode.appendChild(createElement('div', {className: 'col'},
                createElement('img', {src: 'icon/ATTRIBUTE_'+key+'.jpg'}),
                createElement('span', {textContent: '+' + output.attribute[key] + ' '}),
                createElement('span', {translate: 'ATTRIBUTE_'+key, textContent: translate('ATTRIBUTE_'+key)}),
                createElement('span', {textContent: ' (' + stats[key] +')'})
            ));
        }
        if(tempNode.firstChild) {
            resultNode.appendChild(tempNode);
        }
        if(output.ability.length) {
            var tempNode = createElement('div', {className: 'row ability'});
            for(var i = 0, iMax = output.ability.length; i < iMax; i++) {
                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+output.ability[i].name+'.png'}),
                    createElement('span', {translate: output.ability[i].name, textContent: translate(output.ability[i].name)}),
                    createElement('span', {textContent: ' (' + output.ability[i].rank + ')'})
                ));
            }
            resultNode.appendChild(tempNode);
        }
        if(output.talent.length) {
            var tempNode = createElement('div', {className: 'row talent'});
            for(var i = 0, iMax = output.talent.length; i < iMax; i++) {
                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+output.talent[i]+'.png'}),
                        createElement('span', {translate: output.talent[i], textContent: translate(output.talent[i])})
                ));
            }
            resultNode.appendChild(tempNode);
        }
        if(output.skill.length) {
            var tempNode = createElement('div', {className: 'row skill'});
            for(var i = 0, iMax = output.skill.length; i < iMax; i++) {
                var skillBonus = 0,
                    skillName = output.skill[i];
                    
                if(data.skill[skillName][3] != 0) {
                    if(skillName.substr(0, 7) == 'SKILL_S' || skillName.substr(0, 7) == 'SKILL_E') { //expert marksman or scoundrel
                        skillBonus = stats.DEXTERITY;
                    } else if(skillName.substr(0, 7) == 'SKILL_M') { //man at arms
                        skillBonus = stats.STRENGTH;
                    } else { //int based
                        skillBonus = stats.INTELLIGENCE;
                    }

                    skillBonus -= data.skill[skillName][3];
                    if(skillBonus < 0) {
                        skillBonus *= 10;
                    } else if(skillBonus > 0) {
                        skillBonus *= 5;
                        if(skillBonus > 50) {
                            skillBonus = 50;
                        }
                    }
                    skillBonus += 100;
                }

                tempNode.appendChild(createElement('div', {className: 'col'},
                    createElement('img', {src: 'icon/'+output.skill[i]+'.png'}),
                        createElement('span', {translate: output.skill[i], textContent: translate(output.skill[i])}),
                        createElement('span', {textContent: ' (' +skillBonus + '%)'})
                ));
            }
            resultNode.appendChild(tempNode);
        }
        
        //resultNode.appendChild(createElement('div', {textContent: JSON.stringify(output)}));        
        
        //level up
        level++;
        if(level % 2 == 0) {
            stock.attribute++;
        }
        if(level %4 == 3) {
            stock.talent++;
        }
        if(level < 6) {
            stock.ability += 1;
        } else if(level < 11) {
            stock.ability += 2;
        } else {
            stock.ability += 3;
        }
        if(lonewolf) {
            stock.ability += 1;
        }
        
        
        if(current.attribute < inputData.attribute.length || current.ability < inputData.ability.length || current.talent < inputData.talent.length) {
            resultNode.appendChild(createElement('div', {className: 'row level'},
                createElement('div', {className: 'col'},
                    createElement('em', {translate: 'LEVEL', textContent: translate('LEVEL')}),
                    createElement('em', {textContent: ' ' + level}),
                    createElement('span', {textContent: ' ('+stock.attribute+', '+stock.ability+', '+stock.talent+')'})
                )
            ));
        } else {
            level = 31;
        }

    }
}


// run the script
load_data();