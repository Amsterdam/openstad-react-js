import React from 'react';

import { Button, downloadCSV } from 'react-admin';
import jsonExport from 'jsonexport/dist';
import Icon from "@material-ui/icons/ImportExport";
import { useDataProvider } from 'react-admin';
import XLSX from 'xlsx';

import {
  useListContext,
} from 'ra-core';

export const ExportButton = function(props) {
  const dataProvider = useDataProvider();
  const {
    filter,
    filterValues,
    currentSort,
    exporter: exporterFromContext,
    total,
} = useListContext(props);

let exporter = async function(data, id, type) {

    let json = await dataProvider.getIdeasWithArgumentsAndLikes({...filter,
      ...filterValues});

    let ideas = json.data;

    const exportHeaders = [
      {key: 'id', label: 'ID'},
      {key: 'title', label: 'Title'},
      {key: 'summary', label: 'Summary'},
      {key: 'description', label: 'Description'},
      {key: 'location', label: 'Locatie'},
      {key: 'originalId', label: 'Original idea ID', 'extraData': true},
      {key: 'area', label: 'Area', 'extraData': true},
      {key: 'theme', label: 'Theme', 'extraData': true},
      {key: 'advice', label: 'Advice', 'extraData': true},
      {key: 'budget', label: 'Budget'},
      {key: 'ranking', label: 'Ranking', 'extraData': true},
      {key: 'images', label: 'Images', 'extraData': true},
      {key: 'modBreak', label: 'Modbreak'},
      {key: 'firstName', label: 'First name', userData: true},
      {key: 'lastName', label: 'Last name', userData: true},
      {key: 'email', label: 'email', userData: true},
      {key: 'yes', label: 'Votes for'},
    ];

    ideas.forEach((idea) => {
      idea.location = idea.location ? ( idea.location.coordinates[0] + ', ' + idea.location.coordinates[1] ) : '';
    });

    let body = [];

    ideas.forEach((idea) => {
      let ideaLines = [];
      const argLines = [];
      let ideaLine = {};
      
      exportHeaders.forEach((header) => {
        if (header.userData) {
          ideaLine[header.key] = idea.user && idea.user[header.key] ? idea.user[header.key] : '';
        } else {
          ideaLine[header.key] = header.extraData &&  idea.extraData ? idea.extraData[header.key] : ( typeof idea[header.key] == 'string' ? idea[header.key].replace(/\r|\n/g, '\\n') : idea[header.key] );
        }
      });

      const ideaVotes = idea.votes || [];
      const ideaArguments = (idea.argumentsFor || []).concat((idea.argumentsAgainst || []));


      // Make a line in the csv for each argument of an idea
      if(props.withArguments) {
        ideaArguments.sort( (a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .forEach((arg) => {
          const argLine = ideaLine? Object.assign({}, ideaLine): {};
          argLine.argument_userId = arg.userId;
          argLine.argument_sentiment = arg.sentiment;
          argLine.argument_description = arg.description.replace(/\r|\n/g, '\\n');
          argLine.argument_username = arg.user.firstName + ' ' + arg.user.lastName;

          if (arg.reactions && arg.reactions.length) {
            arg.reactions.forEach((reaction) => {
              let reactionLine = argLine || {};
              argLine = undefined;
              reactionLine.reaction_description = reaction.description.replace(/\r|\n/g, '\\n');
              reactionLine.reaction_username = reaction.user.firstName + ' ' + reaction.user.lastName;
              argLines.push(reactionLine);
            });
          }
          if (argLine) argLines.push(argLine); // no reactions have been added
        });
      }

      // Make a line in the csv for each vote of an idea
      if(props.withVotes) {
        ideaVotes.forEach(vote => {
          let argLine = ideaLine? Object.assign({}, ideaLine): {};
          argLine.vote_userId = vote.userId;
          argLine.vote_opinion= vote.opinion;
          argLine.vote_userId = vote.userId;
          if (argLine) argLines.push(argLine);
        });
      }

      if((!ideaVotes.length && !ideaArguments.length) || (!props.withVotes && !props.withArguments)) {
        const argLine = ideaLine? Object.assign({}, ideaLine): {};
        argLines.push(argLine);
      }

      ideaLine = undefined;
      ideaLines = ideaLines.concat(argLines);
      console.log({ideaLines});
      body = body.concat(ideaLines);
    });

    let filename = 'ideas-with-arguments';
    if (type == 'xlsx') {

      if (!filename.match(/\.(?:${type})/)) {
        console.log('No extension');
        filename = `${filename}.${type}`;
      }
      
      let ws_name = "plannen";
      let wb = XLSX.utils.book_new()
      let ws = XLSX.utils.json_to_sheet( body );
      XLSX.utils.book_append_sheet(wb, ws, ws_name);

      XLSX.writeFile(wb, filename);
      
    } else {

      let idea_headers = exportHeaders.map( header => header.key );
      jsonExport(body, {headers: [
        ...idea_headers, 'argument_sentiment', 'argument_description', 'argument_userId', 'argument_username', 'reaction_description', 'reaction_username' 
      ]}, (err, csv) => {
        downloadCSV(csv, `ideas-with-arguments`);
      });
    }

  }

  return (
    <>
      <Button label={props.label} onClick={data => exporter(data, props.id, props.extension)}>
        <Icon/>
      </Button>
    </>);
}

function stringify(value) {
  if (typeof value == 'object') {
    try {
      value = JSON.stringify(value);
    } catch (err) {}
  }
  return value;
}
