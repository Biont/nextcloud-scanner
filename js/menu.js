/**
 * Nextcloud - scanner
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Greg Sutcliffe <nextcloud@emeraldreverie.org>
 * @copyright Greg Sutcliffe 2016
 */

var ScannerMenuPlugin = {
	attach: function (menu) {
		var plugin = this;
		var fileList = menu.fileList;

		menu.addMenuEntry({
			id: 'scanner',
			displayName: 'Scan Image',
			templateName: 'scan.jpg',
			iconClass: 'icon-filetype-scanner',
			fileType: 'file',
			actionHandler: function (name) {
				plugin.scanOptionsModal('Please adjust scan parameters', 'Scan Options', function (result, formData) {
					if (!result) {
						OC.Notification.showTemporary('Scan aborted.');
						return;
					}
					var dir = fileList.getCurrentDirectory();
					OC.Notification.showTemporary('Scan started.');
					$.ajax({
						url: OC.generateUrl('/apps/scanner/scan'),
						async: true,
						type: 'POST',
						data: {
							filename: name,
							dir: dir,
							scanOptions: formData
						},
						success: function (data) {
							fileList.changeDirectory(dir, true, true);
							OC.Notification.showTemporary('Scan complete');
						},
						error: function (data) {
							OC.Notification.showTemporary(data.result);
						}
					});
				});

			}
		});
	},

	getTemplate: function (tplFile) {
		var defer = $.Deferred();
		var self = this;
		$.get(OC.filePath('scanner', 'templates', tplFile), function (tmpl) {
			self.$messageTemplate = $(tmpl);
			defer.resolve(self.$messageTemplate);
		})
			.fail(function (jqXHR, textStatus, errorThrown) {
				defer.reject(jqXHR.status, errorThrown);
			});
		return defer.promise();
	},

	scanOptionsModal: function (text, title, callback, modal) {
		var plugin = this;
		return $.when(this.getTemplate('optionsdialog.html')).then(function ($tmpl) {
			var dialogName = 'oc-dialog-' + OCdialogs.dialogsCounter + '-content';
			var dialogId = '#' + dialogName;
			var $dlg = $tmpl.octemplate({
				dialog_name: dialogName,
				title: title,
				message: text,
				type: 'notice'
			});
			if (modal === undefined) {
				modal = false;
			}
			$('body').append($dlg);

			// wrap callback in _.once():
			// only call callback once and not twice (button handler and close
			// event) but call it for the close event, if ESC or the x is hit
			if (callback !== undefined) {
				callback = _.once(callback);
			}

			var buttonlist = [{
				text: t('core', 'No'),
				click: function () {
					if (callback !== undefined) {
						callback(false, plugin.formArrayToObject($('form', $dlg).serializeArray()));
					}
					$(dialogId).ocdialog('close');
				}
			}, {
				text: t('core', 'Yes'),
				click: function () {
					if (callback !== undefined) {
						callback(true, plugin.formArrayToObject($('form', $dlg).serializeArray()));
					}
					$(dialogId).ocdialog('close');
				},
				defaultButton: true
			}
			];

			$(dialogId).ocdialog({
				closeOnEscape: true,
				modal: modal,
				buttons: buttonlist,
				close: function () {
					// callback is already fired if Yes/No is clicked directly
					if (callback !== undefined) {
						callback(false, plugin.formArrayToObject($('form', $dlg).serializeArray()));
					}
				}
			});
			OCdialogs.dialogsCounter++;
		});
	},
	formArrayToObject: function (formArray) {

		var returnArray = {};
		for (var i = 0; i < formArray.length; i++) {
			returnArray[formArray[i]['name']] = formArray[i]['value'];
		}
		return returnArray;
	}
};
OC.Plugins.register('OCA.Files.NewFileMenu', ScannerMenuPlugin);
