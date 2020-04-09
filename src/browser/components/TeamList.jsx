// Copyright (c) 2015-2016 Yuya Ochiai
// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import PropTypes from 'prop-types';
import {ListGroup} from 'react-bootstrap';
import {ipcRenderer} from 'electron';
import logger from 'electron-log';

import TeamListItem from './TeamListItem.jsx';
import NewTeamModal from './NewTeamModal.jsx';
import RemoveServerModal from './RemoveServerModal.jsx';

import Utils from '../../utils/util';

export default class TeamList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showEditTeamForm: false,
      indexToRemoveServer: -1,
      team: {
        url: 'https://mattermost.ziti.netfoundry.io',
        email: '',
        identity: Utils.generateDefaultIdentityName(),
        name: 'MattermoZt',
        index: false,
        order: props.teams.length,
      },
    };
  }

  handleTeamRemove = (index) => {
    console.log(index);
    const teams = this.props.teams;
    const removedOrder = this.props.teams[index].order;
    teams.splice(index, 1);
    teams.forEach((value) => {
      if (value.order > removedOrder) {
        value.order--;
      }
    });
    this.props.onTeamsChange(teams);
  }

  handleTeamAdd = (team) => {
    const teams = this.props.teams;

    // check if team already exists and then change existing team or add new one
    if ((typeof team.index !== 'undefined') && teams[team.index]) {
      teams[team.index].name = team.name;
      teams[team.index].url = team.url;
      teams[team.index].email = team.email;
      teams[team.index].identity = team.identity;
      teams[team.index].order = team.order;
    } else {
      teams.push(team);
    }

    this.setState({
      showEditTeamForm: false,
      team: {
        url: 'https://mattermost.ziti.netfoundry.io',
        email: '',
        identity: Utils.generateDefaultIdentityName(),
        name: 'MattermoZt',
        index: false,
        order: teams.length,
      },
    });

    this.props.onTeamsChange(teams);
  }

  handleTeamEditing = (teamName, teamUrl, teamEmail, teamIdentity, teamIndex, teamOrder) => {
    this.setState({
      showEditTeamForm: true,
      team: {
        url: teamUrl,
        email: teamEmail,
        identity: teamIdentity,
        name: teamName,
        index: teamIndex,
        order: teamOrder,
      },
    });
  }

  openServerRemoveModal = (indexForServer) => {
    this.setState({indexToRemoveServer: indexForServer});
  }

  closeServerRemoveModal = () => {
    this.setState({indexToRemoveServer: -1});
  }

  render() {
    const self = this;
    const teamNodes = this.props.teams.map((team, i) => {
      function handleTeamRemove() {
        document.activeElement.blur();
        self.openServerRemoveModal(i);
      }

      function handleTeamEditing() {
        document.activeElement.blur();
        self.handleTeamEditing(team.name, team.url, team.email, team.identity, i, team.order);
      }

      function handleTeamClick() {
        self.props.onTeamClick(i);
      }

      return (
        <TeamListItem
          index={i}
          key={'teamListItem' + i}
          name={team.name}
          url={team.url}
          email={team.email}
          identity={team.identity}
          onTeamRemove={handleTeamRemove}
          onTeamEditing={handleTeamEditing}
          onTeamClick={handleTeamClick}
        />
      );
    });

    const addServerForm = (
      <NewTeamModal
        currentOrder={this.props.teams.length}
        show={this.props.showAddTeamForm || this.state.showEditTeamForm}
        editMode={this.state.showEditTeamForm}
        onClose={() => {
          this.setState({
            showEditTeamForm: false,
            team: {
              url: 'https://mattermost.ziti.netfoundry.io',
              email: '',
              identity: Utils.generateDefaultIdentityName(),
              name: 'MattermoZt',
              index: false,
              order: this.props.teams.length,
            },
          });
          this.props.setAddTeamFormVisibility(false);
        }}
        onSave={(newTeam) => {
          const teamData = {
            name: newTeam.name,
            url: newTeam.url,
            email: newTeam.email,
            identity: newTeam.identity,
            order: newTeam.order,
          };
          if (this.props.showAddTeamForm) {
            this.props.addServer(teamData);
          } else {
            this.props.updateTeam(newTeam.index, teamData);
          }
          this.setState({
            showNewTeamModal: false,
            showEditTeamForm: false,
            team: {
              url: 'https://mattermost.ziti.netfoundry.io',
              email: '',
              identity: Utils.generateDefaultIdentityName(),
              name: 'MattermoZt',
              index: false,
              order: newTeam.order + 1,
            },
          });
          this.render();
          this.props.setAddTeamFormVisibility(false);
        }}
        onInitiateEnrollmentFlow={(args) => {
          logger.info('Initiating Enrollment Flow now, args is: %o', args);
          ipcRenderer.send('initiate-enrollment', args);
        }}
        team={this.state.team}
        modalContainer={this.props.modalContainer}
      />);

    const removeServer = this.props.teams[this.state.indexToRemoveServer];
    const removeServerModal = (
      <RemoveServerModal
        show={this.state.indexToRemoveServer !== -1}
        serverName={removeServer ? removeServer.name : ''}
        onHide={this.closeServerRemoveModal}
        onCancel={this.closeServerRemoveModal}
        onAccept={() => {
          this.handleTeamRemove(this.state.indexToRemoveServer);
          this.closeServerRemoveModal();
        }}
        modalContainer={this.props.modalContainer}
      />
    );

    return (
      <ListGroup className='teamList'>
        { teamNodes }
        { addServerForm }
        { removeServerModal}
      </ListGroup>
    );
  }
}

TeamList.propTypes = {
  onTeamsChange: PropTypes.func,
  showAddTeamForm: PropTypes.bool,
  teams: PropTypes.array,
  addServer: PropTypes.func,
  updateTeam: PropTypes.func,
  toggleAddTeamForm: PropTypes.func,
  setAddTeamFormVisibility: PropTypes.func,
  onTeamClick: PropTypes.func,
  modalContainer: PropTypes.object,
};
