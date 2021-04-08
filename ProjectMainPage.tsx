import * as React from 'react';
import { connect } from 'react-redux';
import { injectIntl, InjectedIntl } from 'react-intl';

import emitter from '../../services/EventEmitter';

import { ChannelOrder, FilteroptionOrder } from '../../statics';

import { SelectedDateType } from '../../components/FormComponent/FormDatePicker';
import { selectedIdentityPermissionDetails } from '../../utils/common';
import { updatedChartListBuild } from '../../utils/StatsUtils';
import { folderlabel } from '../../utils/FolderUtils';
import { PermissionDetailsType, IdentityPermissionDetails, StoreState, AccessTokenPayload } from '../../interfaces';
import { ProjectActions, RouterActions } from '../../actions';
import { AppContents, Header, Main, Stats } from '../../components';
import './ProjectMainPage.scss';

export enum FolderButtonType {SELF = 'self', SUB = 'sub'}

interface Props {
  intl: InjectedIntl;
  accessTokenPayload: AccessTokenPayload;
}

export interface State {
  form: object;
  formMeta: object;
  identityPermissionDetails: IdentityPermissionDetails;
}
class ProjectMainPage extends React.Component<Props, State> {
  public state = {
    form: {
      statList: undefined,
      statAverage: undefined,
      chartList: undefined,

      deliveryScheduleList: undefined,
      deliverySendingList: undefined,
      deliverySentList: undefined,
      deliveryWaitingApprovalList: undefined,
    },
    formMeta: {
      scope: 'overView',
      statsOverviewPeriod: 'week', //  TODO 사용 X 예정 DB에서 검색으로 사용중.
      folderButton: {
        folderData: undefined,
        selectedFolder: undefined,
        modal: {
          isOpen: false,
          selectedFolder: undefined,
        },
      },
      folderFilterType: FolderButtonType.SELF, // 해당, 하위 선택 버튼
      menuListButton: [
        {
          icon: 'barChart',
          downIcon: true,
          value: 'barChart',
          label: this.props.intl.messages.statsChannelComparison,
          optionType: 'checkbox',
          option: [
            // {label: this.props.intl.messages.statsRcs, value: 'rcs'},
            {label: this.props.intl.messages.statsRcs_sms, value: 'rcs_sms'},
            {label: this.props.intl.messages.statsRcs_lms, value: 'rcs_lms'},
            {label: this.props.intl.messages.statsRcs_card, value: 'rcs_card'},
            {label: this.props.intl.messages.statsRcs_carousel, value: 'rcs_carousel'},
            {label: this.props.intl.messages.statsRcs_template, value: 'rcs_template'},
            {label: this.props.intl.messages.statsSms, value: 'sms'},
            {label: this.props.intl.messages.statsLms, value: 'lms'},
            {label: this.props.intl.messages.statsMms, value: 'mms'},
          ],
        },
        {
          icon: 'lineChart',
          downIcon: true,
          value: 'lineChart',
          label: this.props.intl.messages.statsDetail,
          optionType: 'selectbox',
          option: [
            // {label: this.props.intl.messages.statsRcs, value: 'rcs'},
            {label: this.props.intl.messages.statsRcs_sms, value: 'rcs_sms'},
            {label: this.props.intl.messages.statsRcs_lms, value: 'rcs_lms'},
            {label: this.props.intl.messages.statsRcs_card, value: 'rcs_card'},
            {label: this.props.intl.messages.statsRcs_carousel, value: 'rcs_carousel'},
            {label: this.props.intl.messages.statsRcs_template, value: 'rcs_template'},
            {label: this.props.intl.messages.statsSms, value: 'sms'},
            {label: this.props.intl.messages.statsLms, value: 'lms'},
            {label: this.props.intl.messages.statsMms, value: 'mms'},
          ],
        },
      ],
      listFilterButton: [{
        downIcon: true,
        value: 'listFilter',
        optionType: 'checkbox',
        option: [
          {label: this.props.intl.messages.statsRequested, value: 'requested'},
          {label: this.props.intl.messages.statsDelivered, value: 'delivered'},
          {label: this.props.intl.messages.statsOpened, value: 'opened'},
          {label: this.props.intl.messages.statsClicked, value: 'clicked'},
          {label: this.props.intl.messages.statsBounced, value: 'bounced'},
          {label: this.props.intl.messages.statsUnsubscribed, value: 'unsubscribed'},
        ] },
      ],
      dateTypeButton: [{
        value: SelectedDateType.DAY, label: this.props.intl.messages.statsDay},
        {value: SelectedDateType.MONTY, label: this.props.intl.messages.statsMonth},
      ],

      optionFilterAdded: 'requested,delivered,opened,clicked,bounced,unsubscribed', // 필터
      datePicker: {
        selectedDate: new Date(),
        startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()),
        endDate: new Date(),
      },

      selectedDepartmentType: 'department', // 선택한 버튼
      selectedWorkCodeType: 'workCode', // 선택한 버튼

      detailSelectedListFilterType: 'detailListFilter', // 선택한 버튼

      detailSelectedChannelListFilterType: 'detailChannelFilter', // 선택한 버튼

      selectedListFilterType: 'listFilter', // 선택한 버튼
      selectedChartType: 'lineChart', // 선택한 버튼
      selectedDateType: SelectedDateType.DAY, // 선택한 버튼

      optionChannelAdded: 'rcs_sms,rcs_lms,rcs_card,rcs_carousel,rcs_template,sms,lms,mms', // 채널비교
      optionChannelDetail: 'rcs_sms', // 채널상세

      selectedButtonOptionOpen: '', // 선택 매뉴리스트

      mouseOverChk: '', // 마우스 위치
    },
    identityPermissionDetails: {
      mainStats: false,
      mainDelivery: false,
      mainApproval: false,
    },
  };
  componentWillMount() {
    const params = { statsOverviewPeriod: 'week' };

    const permissionDetails: PermissionDetailsType = this.props.accessTokenPayload.permissionDetails;
    const identityType = this.props.accessTokenPayload.type;
    const identityPermissionDetails = selectedIdentityPermissionDetails('main', permissionDetails, '', identityType);
    this.setState({identityPermissionDetails}, () => {
      this.requestData(params, 'rcs_sms,rcs_lms,rcs_card,rcs_carousel,rcs_template,sms,lms,mms');
    });
    emitter.on('mousedown', this.statsOnMouseDown);
  }
  componentWillUnmount() {
    emitter.removeListener('mousedown', this.statsOnMouseDown);
  }
  statsOnMouseDown = (type) => {
    const { formMeta, formMeta: {mouseOverChk} } = this.state;
    if (mouseOverChk === '') {
      this.setState({formMeta: {...formMeta, selectedButtonOptionOpen: ''}});
    }
  }

  requestData = (params, options) => {
    const { formMeta : {selectedChartType, optionChannelAdded, optionChannelDetail} } = this.state;
    const id = window.location.pathname.split('/').slice(-1).pop();
    ProjectActions.statsGetOne(id, 'main', params, (form) => {
      if (form) {
        const chartList = updatedChartListBuild('overView', selectedChartType, options, optionChannelDetail, (form as any).statList);
        // const chartList = (form as any).chartList;
        this.setState({form: { ...form, chartList } });
      }
    });
  }

  onStatsAction = (type, payload) => {
    const { form, formMeta } = this.state;
    let chartList;
    switch (type) {
      case 'header-visible' :
        return this.setState({formMeta: {...formMeta, detailTableHeader: payload}});
      case 'channel-check' :
        if (payload.name.indexOf('detail') === -1) { // 차트, 상세 테이블
          if (payload.name === 'optionFilterAdded') { // 항목 필터
            chartList = updatedChartListBuild(formMeta.scope, formMeta.selectedChartType, formMeta.optionChannelAdded, formMeta.optionChannelDetail, form.statList);
          } else { // optionChannelAdded
            chartList = updatedChartListBuild(formMeta.scope, formMeta.selectedChartType, payload.value, formMeta.optionChannelDetail, form.statList);
          }
          return this.setState({form: {...form, chartList}, formMeta: {...formMeta, [payload.name]: payload.value}});
        } else {
          return this.setState({formMeta: {...formMeta, [payload.name]: payload.value}});
        }
        case 'all-channel-check':
          const addedOptions = {
            optionChannelAdded: ChannelOrder.slice(0, ChannelOrder.length - 1).toString(),
            optionFilterAdded: FilteroptionOrder.slice(0, ChannelOrder.length + 1).toString(),
            detailOptionFilterAdded: FilteroptionOrder.slice(0, ChannelOrder.length + 1).toString(),
            detailChannelOptionFilterAdded: ChannelOrder.slice(0, ChannelOrder.length).toString() }[payload.name];

          const channelAddedValue = payload.value ? addedOptions : '';
          // if (payload.name.indexOf('detail') !== -1) { // 차트, 상세 테이블
          //   // chartList = updatedChartListBuild(formMeta.scope, formMeta.selectedChartType, formMeta.optionChannelAdded, formMeta.optionChannelDetail, form.statList);
          //   chartList = updatedChartListBuild(formMeta.scope, formMeta.selectedChartType, channelAddedValue, formMeta.optionChannelDetail, form.statList);
          //   return this.setState({form: {...form, chartList}, formMeta: {...formMeta, [payload.name]: channelAddedValue}});
          // } else {
          return this.setState({formMeta: {...formMeta, [payload.name]: channelAddedValue}});
          // }
      case 'channel-detail-select':
        chartList = updatedChartListBuild(formMeta.scope, formMeta.selectedChartType, formMeta.optionChannelAdded, payload.value, form.statList);
        return this.setState({form: {...form, chartList}, formMeta: {...formMeta, [payload.name]: payload.value}});
      case 'multibutton-click':
        const selectedChartType = payload.name === 'selectedChartType' ? payload.value : formMeta.selectedChartType;
        chartList = updatedChartListBuild(formMeta.scope, selectedChartType, formMeta.optionChannelAdded, formMeta.optionChannelDetail, form.statList);
        const selectedType = {
          listFilter: formMeta.selectedListFilterType,
          barChart: formMeta.selectedChartType,
          lineChart: formMeta.selectedChartType,
          detailListFilter: formMeta.detailSelectedListFilterType,
          detailChannelFilter: formMeta.detailSelectedChannelListFilterType,
          department: formMeta.selectedDepartmentType,
          workCode: formMeta.selectedWorkCodeType,
        }[formMeta.mouseOverChk];

        const selectedChannelComparison = selectedType === payload.value;
        let selectedButtonOptionOpen = '';
        if (selectedChannelComparison) {
          const sameChannelToOption = selectedType === formMeta.selectedButtonOptionOpen;
          selectedButtonOptionOpen = sameChannelToOption ? '' : payload.value;
        } else {
          selectedButtonOptionOpen = payload.value;
        }

        let datePicker = formMeta.datePicker;
        if (payload.name === 'selectedDateType' && formMeta.selectedDateType !== payload.value) {
          datePicker = {
            selectedDate: new Date(),
            startDate: new Date(
              new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()),
            endDate: new Date(),
          };
        }

        return this.setState({form: {...form, chartList}, formMeta: {...formMeta, [payload.name]: payload.value, selectedButtonOptionOpen, datePicker} }, () => {
          if (payload.name === 'selectedDateType' && formMeta.selectedDateType !== payload.value) {
            this.requestData(this.getParams(datePicker.startDate, datePicker.endDate, payload.value), formMeta.optionChannelAdded);
          }
        });
      case 'mouse-over':
        return this.setState({formMeta: {...formMeta, mouseOverChk: payload}});
      case 'datePicker':
        const params = this.getParams(
          payload.datePickerType === 'startDate' ? payload.time : formMeta.datePicker.startDate,
          payload.datePickerType === 'endDate' ? payload.time : formMeta.datePicker.endDate,
          formMeta.selectedDateType);
        this.requestData(params, formMeta.optionChannelAdded);
        return this.setState({formMeta: {...formMeta, datePicker: {...formMeta.datePicker, [payload.datePickerType]: payload.time }}});
      case 'folder-button-type-click':
        return this.setState({formMeta: {...formMeta, [payload.name]: payload.value }});
      case 'folder-row-click':
        let selectedFolderLabel = '';
        let folderFilterType = FolderButtonType.SELF;
        let buttonBlock = false;
        if (payload.id) { // TODO: 폴더내용 없을 시 해당부서만 버튼 나오도록 buttonBlock 수정.
          const folderData = formMeta.folderButton.folderData;
          selectedFolderLabel = folderlabel(folderData, payload.id);
          buttonBlock = !payload.hasChildren;
          folderFilterType = payload.hasChildren ? formMeta.folderFilterType : FolderButtonType.SELF;
        }
        return this.setState({formMeta: {
          ...formMeta,
          buttonBlock,
          folderFilterType,
          selectedFolderLabel,
          folderButton: {...formMeta.folderButton, selectedFolder: payload },
        }});
      case 'folder-menu-apply':
        return this.setState({formMeta: {...formMeta, selectedButtonOptionOpen: '' }}, () => {
          this.requestData(this.getParams(formMeta.datePicker.startDate, formMeta.datePicker.endDate, formMeta.selectedDateType), formMeta.optionChannelAdded);
        });
      case 'folder-menu-cancel':
        return this.setState({formMeta: {...formMeta, selectedButtonOptionOpen: '' }});
    }
  }

  getParams = (startDate, endDate, periodType) => {
    const { formMeta } = this.state;

    let FolderFilterType: {};
    switch (formMeta.scope) {
      case '' :
        FolderFilterType = {};
        break;
      case 'department' :
        FolderFilterType = {departmentFilterType: '', departmentId: ''};
        break;
      case 'workcode' :
        FolderFilterType = {workcodeFilterType: '', workcodeId: ''};
        break;
    }

    return {
      statsOverviewPeriod: formMeta.statsOverviewPeriod, // TODO: 삭제 (사용 x)
      startDate,
      endDate,
      periodType,
      ...FolderFilterType,
    };
  }

  onMainAction = (type, payload) => {
    const id = window.location.pathname.split('/').slice(-1).pop();
    switch (type) {
      case 'link-page' :
        return RouterActions.push(`/project/${id}/${payload.pageName}/list`);
      case 'link-page-delivery-schedule' :
        return RouterActions.push(`/project/${id}/${payload.pageName}`);
      case 'link-detail-page' :
        return RouterActions.push(`/project/${id}/${payload.pageName}/${payload.id}`);
    }
  }
  render() {
    const {intl: {messages}} = this.props;
    const { form, formMeta, identityPermissionDetails } = this.state;

    return (
      <AppContents classType='app-contents navigator'>
        <Header.Navigator title={messages.projectMainMainTitle} />
        <div className='mainWrap'>
          {identityPermissionDetails.mainStats &&
          <Stats onAction={this.onStatsAction}>
            <Stats.StatsSearchMenu
              selectedButtonOptionOpen={formMeta.selectedButtonOptionOpen}
              optionChannelDetail={formMeta.optionChannelDetail}
              menuListButton={formMeta.menuListButton}
              selectedChartTypeButton={formMeta.selectedChartType}
              optionChannelAdded={formMeta.optionChannelAdded}
              listFilterButton={formMeta.listFilterButton}
              optionFilterAdded={formMeta.optionFilterAdded}
              datePicker={formMeta.datePicker}
              selectedDateType={formMeta.selectedDateType}
              dateTypeButton={formMeta.dateTypeButton}
            />
            <Stats.StatsDeliveryOverview
              optionChannelAdded={formMeta.optionChannelAdded}
              statAverage={form.statAverage}
              chartList={form.chartList}
              selectedChartTypeButton={formMeta.selectedChartType}
              optionFilterAdded={formMeta.optionFilterAdded}

              statList={form.statList}
              optionChannelDetail={formMeta.optionChannelDetail}
              selectedListFilterButton={formMeta.selectedListFilterType}
            />
          </Stats>}
          <Main onAction={this.onMainAction}>
            <Main.DeliverySchedule deliveryScheduleList={form.deliveryScheduleList} isDisplay={identityPermissionDetails.mainDelivery} />
            <Main.DeliverySummaryList
              deliverySentList={form.deliverySentList}
              deliverySendingList={form.deliverySendingList}
              deliveryWaitingApprovalList={form.deliveryWaitingApprovalList}
              identityPermissionDetails={identityPermissionDetails}
            />
          </Main>
        </div>
      </AppContents>
    );
  }
}

// export default injectIntl(ProjectMainPage);
export default connect((state: StoreState) => ({
  accessTokenPayload: state.auth.accessTokenPayload,
}))(injectIntl(ProjectMainPage));
